# -*- coding: utf-8 -*-
"""
chabot_model.py
- LLM + LangChain + RAG 파이프라인
- 온토픽 감지(LLM), 감정/근거/키워드 추출(LLM), 요약(<요약> 섹션), 구조적 JSON 요약
- ✅ 허용 모델을 'gpt-4o'와 'gpt-4o-mini'로 **엄격 제한**
- ✅ 기본은 gpt-4o, 사용자가 원하면 gpt-4o-mini 선택 가능
- ✅ 알 수 없는 모델명 입력 시 ValueError (서버에서 400으로 내려주길 권장)
"""

import os, json, re, time
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document


# --- PATCH: loose JSON parser & helpers ---
import re as _re

def _json_loose_loads(text: str) -> dict:
    """
    모델이 JSON을 코드펜스로 감싸거나 스마트따옴표/트레일링 콤마가 섞여도 최대한 파싱.
    실패 시 ValueError를 그대로 던짐.
    """
    if not text:
        raise ValueError("empty")
    # 코드펜스 제거
    t = text.strip()
    t = _re.sub(r"^```(?:json)?\s*", "", t)
    t = _re.sub(r"\s*```$", "", t)

    # 첫 번째 { ... } 블록만 추출
    m = _re.search(r"\{.*\}", t, flags=_re.DOTALL)
    if not m:
        raise ValueError("no-json-object")
    s = m.group(0)

    # 스마트 따옴표 정규화
    s = s.replace("“", "\"").replace("”", "\"").replace("’", "'").replace("‘", "'")

    # }나 ] 앞의 트레일링 콤마 제거
    s = _re.sub(r",(\s*[}\]])", r"\1", s)

    return json.loads(s)

def _first_sentence_containing(text: str, keyword: str) -> str:
    for sent in _re.split(r"[.!?\n]+", text):
        if keyword in sent:
            st = sent.strip()
            if 6 <= len(st) <= 120:
                return st
    return ""

# -------------------------------
# 0) 환경/키 로딩
# -------------------------------
load_dotenv()

API_TOKEN_PATH = os.getenv("API_TOKEN", "./api_token.txt")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEV_USE_TOKEN_FILE = os.getenv("DEV_USE_TOKEN_FILE", "1") == "1"

if not OPENAI_API_KEY and DEV_USE_TOKEN_FILE and os.path.exists(API_TOKEN_PATH):
    try:
        with open(API_TOKEN_PATH, "r", encoding="utf-8") as f:
            k = f.read().strip()
        if k:
            os.environ["OPENAI_API_KEY"] = k
            OPENAI_API_KEY = k
            print("✅ OpenAI API 키를 api_token.txt에서 로드했습니다.")
    except Exception as e:
        print(f"⚠️ API 토큰 로드 실패: {e}")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY 가 설정되어 있지 않습니다. .env 또는 환경변수를 확인하세요.")

# -------------------------------
# 1) 기본값 (요청에서 오버라이드 가능)
# -------------------------------
# ✅ 기본을 gpt-4o로 고정
DEFAULT_CHAT_MODEL  = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o")
DEFAULT_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
DEFAULT_TEMPERATURE = float(os.getenv("TEMPERATURE", "0.2"))
DEFAULT_MAX_TOKENS  = int(os.getenv("MAX_OUTPUT_TOKENS", "800"))

OFF_TOPIC_MESSAGE = "치매와 관련없는 내용으로 판단됩니다. 해당 챗봇은 치매와 인지장애 관련 상담만 가능합니다."

# 고정 질문
Q1 = '자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?'
Q2 = '대화중단어가 잘 떠오르지 않아서 곤란했던 적이 있나요?'
Q3 = '가족이나 지인이 평소와 다르다고 한적이 있나요?'
Q4 = '최근에 불편했던 점이나 걱정되는 점이 있나요?'
GUIDE_QUESTIONS = [Q1, Q2, Q3, Q4]

# -------------------------------
# 2) 모델/클라이언트
# -------------------------------
@dataclass
class ClientBundle:
    llm_summary: ChatOpenAI
    llm_judge:   ChatOpenAI
    llm_query:   ChatOpenAI
    llm_emo:     ChatOpenAI
    embeddings:  OpenAIEmbeddings
    temperature: float
    max_tokens:  int
    model_ids:   Dict[str, str]

# ✅ 허용 모델 화이트리스트 (챗/임베딩)
ALLOWED_CHAT = {"gpt-4o", "gpt-4o-mini"}
ALLOWED_EMBED = {"text-embedding-3-small", "text-embedding-3-large"}

def _normalise_model_id(mid: Optional[str], kind: str) -> Optional[str]:
    """
    kind: "chat" | "embed"
    - 흔한 별칭/오타만 gpt-4o / gpt-4o-mini로 보정
    - 그 외는 ValueError (엄격)
    """
    if not mid:
        return None
    m = mid.strip()

    # 별칭 보정 (딱 4o 계열만 허용)
    aliases = {
        "gpt4o": "gpt-4o",
        "gpt-o4": "gpt-4o",
        "gpt-4-omni": "gpt-4o",
        "4o": "gpt-4o",
        "4o-mini": "gpt-4o-mini",
        # 'o4', 'o4-mini' 등은 허용하지 않음
        "text-embedding-3small": "text-embedding-3-small",
        "text-embedding-3large": "text-embedding-3-large",
    }
    m = aliases.get(m, m)

    if kind == "chat":
        if m not in ALLOWED_CHAT:
            raise ValueError(f"Unsupported chat model: {mid}. Allowed: {sorted(ALLOWED_CHAT)}")
    else:
        if m not in ALLOWED_EMBED:
            raise ValueError(f"Unsupported embedding model: {mid}. Allowed: {sorted(ALLOWED_EMBED)}")
    return m

def _build_clients(
    chat_model: Optional[str] = None,
    embed_model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    models: Optional[Dict[str, str]] = None,
) -> ClientBundle:
    # ✅ 엄격 정규화
    cm_in  = _normalise_model_id(chat_model  or DEFAULT_CHAT_MODEL,  "chat")
    em_in  = _normalise_model_id(embed_model or DEFAULT_EMBED_MODEL, "embed")

    tmp = DEFAULT_TEMPERATURE if temperature is None else float(temperature)
    mx  = DEFAULT_MAX_TOKENS  if max_tokens  is None else int(max_tokens)

    m_summary = m_judge = m_query = m_emo = cm_in
    m_embed   = em_in

    if models and isinstance(models, dict):
        # 구성요소별 지정도 허용 (단, 허용 모델 내)
        if "summary" in models: m_summary = _normalise_model_id(models["summary"], "chat")
        if "judge"   in models: m_judge   = _normalise_model_id(models["judge"],   "chat")
        if "query"   in models: m_query   = _normalise_model_id(models["query"],   "chat")
        if "emotion" in models: m_emo     = _normalise_model_id(models["emotion"], "chat")
        if "embed"   in models: m_embed   = _normalise_model_id(models["embed"],   "embed")

    # 인스턴스
    llm_summary = ChatOpenAI(model=m_summary, temperature=tmp, max_tokens=mx, api_key=OPENAI_API_KEY)
    llm_judge   = ChatOpenAI(model=m_judge,   temperature=0.0, max_tokens=min(mx, 220), api_key=OPENAI_API_KEY)
    llm_query   = ChatOpenAI(model=m_query,   temperature=0.1, max_tokens=min(mx, 120), api_key=OPENAI_API_KEY)
    llm_emo     = ChatOpenAI(model=m_emo,     temperature=0.1, max_tokens=min(mx, 500), api_key=OPENAI_API_KEY)
    embeddings  = OpenAIEmbeddings(model=m_embed, api_key=OPENAI_API_KEY)

    return ClientBundle(
        llm_summary=llm_summary,
        llm_judge=llm_judge,
        llm_query=llm_query,
        llm_emo=llm_emo,
        embeddings=embeddings,
        temperature=tmp,
        max_tokens=mx,
        model_ids={
            "summary": m_summary,
            "judge":   m_judge,
            "emotion": m_emo,
            "query":   m_query,
            "embed":   m_embed,
        }
    )

# -------------------------------
# 3) 온토픽 감지(LLM) — 전체 문장
# -------------------------------
CLASSIFY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "너는 입력이 ‘치매/인지장애 상담’인지 판단하는 분류기다. "
     "판단 기준: (a) 기억력 저하/단어 회상 곤란/언어 유창성 저하/방향감각 문제/일상생활 곤란/정서반응 등 구체적 서술, "
     "(b) 보호자 관찰/검사/평가/안전 문제/가족 교육. "
     "메타 대화(너는 누구냐, 상담 되냐 등), 일반 잡담, 비치매 일반 건강/일상은 off_topic. "
     "오직 JSON만 출력: "
     "{{\"on_topic\": true|false, \"score\": 0.0~1.0, "
     "\"evidence_spans\": [\"...\", \"...\"], \"reason\": \"...\"}}. "
     "evidence_spans는 원문 발췌 1~3개(각 6~40자)."),
    ("human", "입력:\n\"\"\"\n{user_text}\n\"\"\"\n오직 JSON:")
])

DEFAULT_PRIOR = 0.60
SESSION_STATE: Dict[str, Dict] = {}

def _get_session(session_id: Optional[str]) -> Dict:
    sid = session_id or "default"
    if sid not in SESSION_STATE:
        SESSION_STATE[sid] = {"prior": DEFAULT_PRIOR, "last_ts": time.time(), "history": []}
    return SESSION_STATE[sid]

def mark_guide_question_shown(session_id: Optional[str]):
    s = _get_session(session_id)
    s["prior"] = max(s["prior"], 0.75)

def _update_session(session_id: Optional[str], label: str, prob: float):
    s = _get_session(session_id)
    s["history"].append({"label": label, "prob": prob})
    s["last_ts"] = time.time()
    last = s["history"][-3:]
    s["prior"] = 0.5 * s["prior"] + 0.5 * (sum(h["prob"] for h in last) / len(last))

TAU_ON = 0.60
BAND   = (0.48, 0.60)

def detect_topic(text: str, judge_llm: ChatOpenAI, session_id: Optional[str] = None) -> Dict[str, Any]:
    parser = StrOutputParser()
    judge_chain = CLASSIFY_PROMPT | judge_llm | parser
    t = (text or "").strip()
    if not t:
        return {"label": "off_topic", "prob": 0.0, "evidence": []}
    
    try:
        raw = judge_chain.invoke({"user_text": t})
        print(f"🔍 LLM 원본 응답: {raw}")  # 디버깅용
        
        # 코드펜스 제거 (```json, ``` 등)
        cleaned_raw = raw.strip()
        if cleaned_raw.startswith("```"):
            # 첫 번째 ``` 제거
            cleaned_raw = cleaned_raw[3:]
            # 마지막 ``` 제거
            if cleaned_raw.endswith("```"):
                cleaned_raw = cleaned_raw[:-3]
            # json, python 등 언어 표시 제거
            cleaned_raw = cleaned_raw.lstrip("json\n").lstrip("python\n").lstrip("```\n")
        
        cleaned_raw = cleaned_raw.strip()
        print(f"🧹 정리된 응답: {cleaned_raw}")  # 디버깅용
        
        data = json.loads(cleaned_raw)
        on_topic = bool(data.get("on_topic", False))
        score = float(data.get("score", 0.0))
        reason = str(data.get("reason", ""))
        
        # on_topic이 false면 확실히 off_topic
        if not on_topic:
            return {"label": "off_topic", "prob": score, "evidence": [reason]}
        
        # on_topic이 true이고 score가 높으면 on_topic
        if score >= TAU_ON:
            return {"label": "on_topic", "prob": score, "evidence": [reason]}
        else:
            return {"label": "off_topic", "prob": score, "evidence": [reason]}
            
    except Exception as e:
        print(f"⚠️ detect_topic 오류: {e}")
        # 오류 시 기본값으로 off_topic
        return {"label": "off_topic", "prob": 0.0, "evidence": ["파싱 오류"]}

# -------------------------------
# 4) 세그먼트 단위 판별 + 비치매 과업 감지
# -------------------------------
SEGMENT_CLASSIFY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "너는 문장이 ‘치매/인지장애 상담’에 해당하는지 판단하는 분류기다.\n"
     "판단 기준: (a) 기억저하/단어회상곤란/언어유창성 저하/길잃음/방향감각 문제/일상생활 곤란/정서반응(불안·두려움·수치심 등) 중 "
     "적어도 하나의 **구체적 경험/우려**가 나타나면 on_topic. 일상 추천/메뉴 선택/광고/가격/일반 수다는 off_topic.\n"
     "오직 JSON: {{\"on_topic\": true|false, \"score\": 0.0~1.0}}"),
    ("human", "문장:\n\"\"\"\n요즘 약속 장소 이름이 자꾸 생각이 안 나요. 멋쩍어서 웃고 넘어가요.\n\"\"\"\n오직 JSON:"),
    ("assistant", "{\"on_topic\": true, \"score\": 0.86}"),
    ("human", "문장:\n\"\"\"\n오늘 와퍼 먹을까 통새우 와퍼 먹을까 골라줘.\n\"\"\"\n오직 JSON:"),
    ("assistant", "{\"on_topic\": false, \"score\": 0.05}"),
    ("human", "문장:\n\"\"\"\n대화하다가 단어가 자꾸 막혀요. 그게 떠오르지 않아서 대화 흐름이 끊겨요.\n\"\"\"\n오직 JSON:"),
    ("assistant", "{\"on_topic\": true, \"score\": 0.88}"),
    ("human", "문장:\n\"\"\"\n기억이 잘 안 나서 무섭고 당황스러워요.\n\"\"\"\n오직 JSON:"),
    ("assistant", "{\"on_topic\": true, \"score\": 0.9}"),
    ("human", "문장:\n\"\"\"\n근데 치킨이랑 피자 중에 뭐가 더 좋아?\n\"\"\"\n오직 JSON:"),
    ("assistant", "{\"on_topic\": false, \"score\": 0.07}"),
    ("human", "문장:\n\"\"\"\n{sent}\n\"\"\"\n오직 JSON:")
])
_segment_judge_parser = StrOutputParser()

OFFDOMAIN_TASK_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "입력이 ‘치매상담’ 이외의 **실제 과업 요청**(예: 메뉴 추천, 식당/음식/쇼핑/가격/영양/쿠폰/광고/게임/코딩/날씨 등)을 포함하는지 판정하라.\n"
     "오직 JSON: {{\"non_dementia_task\": true|false, \"spans\": [\"...\", \"...\"]}}"),
    ("human", "입력:\n\"\"\"\n{whole}\n\"\"\"\n오직 JSON:")
])
_offdomain_parser = StrOutputParser()

def _split_into_segments(text: str) -> List[str]:
    raw = re.split(r"(?:\n+|[.!?]+|\r+|^\s*\d+[.)]\s*)", text)
    segs = [s.strip() for s in raw if s and s.strip()]
    return [s for s in segs if len(s) >= 2]

def classify_segments(text: str, judge_llm: ChatOpenAI) -> List[Dict[str, Any]]:
    segments = _split_into_segments(text)
    chain = SEGMENT_CLASSIFY_PROMPT | judge_llm | _segment_judge_parser
    out: List[Dict[str, Any]] = []
    for s in segments:
        try:
            js = json.loads(chain.invoke({"sent": s}))
            out.append({"text": s, "on_topic": bool(js.get("on_topic", False)), "score": float(js.get("score", 0.5))})
        except Exception:
            out.append({"text": s, "on_topic": False, "score": 0.5})
    # 폴백(동일 모델에서 모두 0.5 default 느낌일 때, mini로 재시도)
    if out and all((not x["on_topic"] and abs(x["score"] - 0.5) < 1e-9) for x in out):
        try:
            fb_judge = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, max_tokens=220, api_key=OPENAI_API_KEY)
            fb_chain = SEGMENT_CLASSIFY_PROMPT | fb_judge | _segment_judge_parser
            out_fb: List[Dict[str, Any]] = []
            for s in segments:
                try:
                    js = json.loads(fb_chain.invoke({"sent": s}))
                    out_fb.append({"text": s, "on_topic": bool(js.get("on_topic", False)), "score": float(js.get("score", 0.5))})
                except Exception:
                    out_fb.append({"text": s, "on_topic": False, "score": 0.5})
            if any(x["on_topic"] or abs(x["score"] - 0.5) > 0.0 for x in out_fb):
                out = out_fb
        except Exception:
            pass
    return out

def detect_offdomain_task(text: str, judge_llm: ChatOpenAI) -> Dict[str, Any]:
    chain = OFFDOMAIN_TASK_PROMPT | judge_llm | _offdomain_parser
    try:
        js = json.loads(chain.invoke({"whole": text}))
        return {
            "non_dementia_task": bool(js.get("non_dementia_task", False)),
            "spans": [str(x) for x in (js.get("spans") or [])][:2]
        }
    except Exception:
        return {"non_dementia_task": False, "spans": []}

RESCUE_TRIGGERS = re.compile(
    r"(기억|떠올리|생각이\s*안\s*나|단어|말이\s*막히|까먹|무서워|두렵|멋쩍|당황)",
    re.IGNORECASE
)

def apply_topic_policy(text: str, judge_llm: ChatOpenAI) -> Dict[str, Any]:
    segs = classify_segments(text, judge_llm)
    if not segs:
        return {"label": "off_topic", "coverage": 0.0, "filtered_text": "", "dropped_segments": [], "offdomain": {}, "segments": []}

    on = [s for s in segs if s["on_topic"]]
    coverage = len(on) / max(1, len(segs))
    offd = detect_offdomain_task(text, judge_llm)

    if len(on) == 0 and RESCUE_TRIGGERS.search(text):
        on = segs
        coverage = 1.0

    STRONG_ON_EXISTS = any(s["score"] >= 0.70 for s in on)
    if coverage < 0.25 and not STRONG_ON_EXISTS:
        label = "off_topic"
    elif 0.25 <= coverage < 0.55 or offd["non_dementia_task"]:
        label = "partial"
    else:
        label = "on_topic"

    filtered = " ".join([s["text"] for s in on]).strip()
    dropped = [s["text"] for s in segs if s not in on]

    return {
        "label": label,
        "coverage": coverage,
        "filtered_text": filtered,
        "dropped_segments": dropped,
        "offdomain": offd,
        "segments": segs
    }

# -------------------------------
# 5) 검색 → RAG 컨텍스트
# -------------------------------
QUERY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "의료 상담 보조 검색어 생성기이다. 입력 STT에서 핵심 증상/키워드를 뽑아 "
     "치매/경도인지장애와 관련된 한국어 검색질의 2~4개를 JSON 배열로만 출력하라."),
    ("human", "{transcript}")
])

def make_search_queries(transcript: str, query_llm: ChatOpenAI) -> List[str]:
    parser = StrOutputParser()
    chain = QUERY_PROMPT | query_llm | parser
    base = ["치매 초기 증상", "경도인지장애 언어 유창성", "일상 안전 가족 교육", "단기 기억력 저하 원인"]
    try:
        raw = chain.invoke({"transcript": transcript})
        qs = [q for q in json.loads(raw) if isinstance(q, str)]
        return (qs + base)[:4]
    except Exception:
        return base[:4]

def ddgs_search(query: str, k: int = 5) -> List[Document]:
    try:
        from ddgs import DDGS
    except Exception:
        return []
    docs: List[Document] = []
    try:
        with DDGS() as d:
            for i, item in enumerate(d.text(query, max_results=k)):
                title = item.get("title") or ""
                link  = item.get("href") or ""
                body  = item.get("body") or ""
                docs.append(Document(
                    page_content=f"{title}\n{body}\nURL: {link}",
                    metadata={"source": link, "title": title, "engine": "ddgs"}))
                if i+1 >= k:
                    break
    except Exception as e:
        print(f"⚠️ ddgs 검색 실패: {e}")
    return docs

def multi_engine_search(query: str, k: int = 5) -> List[Document]:
    return ddgs_search(query, k)

def _embed_texts(texts: List[str], embeddings: OpenAIEmbeddings) -> List[List[float]]:
    return embeddings.embed_documents(texts)

def _embed_query(text: str, embeddings: OpenAIEmbeddings) -> List[float]:
    return embeddings.embed_query(text)

def _cosine(a: List[float], b: List[float]) -> float:
    import numpy as np
    a = np.array(a, dtype=float); b = np.array(b, dtype=float)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-12
    return float((a @ b) / denom)

def build_rag_context_rerank(
    transcript: str,
    queries: List[str],
    embeddings: OpenAIEmbeddings,
    k_search: int = 8,
    k_rerank: int = 8,
    k_final: int  = 4
) -> Tuple[str, List[Dict[str, str]]]:
    all_docs: List[Document] = []
    for q in queries:
        all_docs.extend(multi_engine_search(q, k=max(3, k_search // max(1, len(queries)) + 1)))
    if not all_docs:
        return "", []
    combined_query = ((" ".join(queries)) + " " + transcript[:600]).strip()
    q_emb = _embed_query(combined_query, embeddings)
    cand = all_docs[:k_rerank]
    cand_texts = [d.page_content for d in cand]
    cand_embs  = _embed_texts(cand_texts, embeddings)
    scored = [(_cosine(q_emb, e), i) for i, e in enumerate(cand_embs)]
    scored.sort(key=lambda x: x[0], reverse=True)
    top_docs = [cand[i] for (_, i) in scored[:k_final]]
    rag_text = "\n\n".join([d.page_content[:1200] for d in top_docs])
    sources = [{"title": d.metadata.get("title",""), "url": d.metadata.get("source",""), "engine": d.metadata.get("engine","")} for d in top_docs]
    return rag_text, sources

# -------------------------------
# 6) 감정/근거/키워드 추출(LLM)
# -------------------------------
EMO_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "다음 텍스트에서 감정 상태를 식별하라. 감정 라벨은 입력으로부터 자연스럽게 도출된 한국어 명사형(예: 두려움, 불안감, 수치심, 당황스러움, 답답함 등)으로 작성. "
     "각 감정 항목:\n"
     " - evidence_sentences: 원문 그대로 발췌 1~2개(각 6~100자)\n"
     " - keywords: 원문/근거문장에 실제로 등장하거나 대표하는 단어/구 3~8개\n"
     "유사 감정 통합, 중복 문장 제거, 총 1~4개. "
     "오직 JSON 배열만 출력: "
     "[{{\"emotion\":\"...\", \"evidence_sentences\":[\"...\"], \"keywords\":[\"...\"]}}, ...]"),
    ("human", "텍스트:\n{transcript}\n오직 JSON:")
])

FORCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "최소 1개 감정 항목을 반드시 생성한다. 포맷/제약 동일. 오직 JSON. "
               "예시 형식: "
               "[{{\"emotion\":\"...\", \"evidence_sentences\":[\"...\"], \"keywords\":[\"...\"]}}]"),
    ("human", "텍스트:\n{transcript}\n오직 JSON:")
])

def extract_emotions_with_keywords(transcript: str, emo_llm: ChatOpenAI) -> List[Dict]:
    parser = StrOutputParser()
    emo_chain   = EMO_PROMPT   | emo_llm | parser
    force_chain = FORCE_PROMPT | emo_llm | parser

    def _top_keywords_from_text(text: str, k: int=6) -> List[str]:
        toks = re.findall(r"[가-힣]{2,}", text)
        out, seen = [], set()
        for t in toks:
            if t not in seen:
                seen.add(t); out.append(t)
            if len(out) >= k:
                break
        return out

    def _parse_emo_json(raw: str) -> List[Dict]:
        def _to_json(r: str) -> Any:
            try:
                return json.loads(r)
            except Exception:
                # 코드펜스/스마트따옴표/트레일링 콤마 등 보정
                return _json_loose_loads(r)
    
        try:
            data = _to_json(raw)
            if not isinstance(data, list):
                return []
            items = []
            for it in data:
                emo = (it.get("emotion") or "").strip()
                evs = [e.strip() for e in (it.get("evidence_sentences") or []) if isinstance(e, str)]
                kws = [k.strip() for k in (it.get("keywords") or []) if isinstance(k, str)]
                evs = [e for e in evs if 6 <= len(e) <= 120][:2]
                if not emo or not evs:
                    continue
                if len(kws) < 3:
                    for e in evs:
                        # 간단 키워드 보강
                        toks = _re.findall(r"[가-힣]{2,}", e)
                        for t in toks[:4]:
                            if t not in kws:
                                kws.append(t)
                kws = list(dict.fromkeys([k for k in kws if 1 <= len(k) <= 20]))[:8]
                if not kws:
                    toks = _re.findall(r"[가-힣]{2,}", " ".join(evs))
                    kws = list(dict.fromkeys(toks))[:5]
                items.append({"emotion": emo, "evidence_sentences": evs, "keywords": kws})
            return items[:4]
        except Exception:
            return []


    # 1차
    try:
        raw = emo_chain.invoke({"transcript": transcript})
    except Exception:
        raw = ""
    items = _parse_emo_json(raw)
    if not items:
        try:
            raw2 = force_chain.invoke({"transcript": transcript})
        except Exception:
            raw2 = "[]"
        items = _parse_emo_json(raw2)
    if items:
        return items

    # 2차 폴백(gpt-4o-mini)
    try:
        fb = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, max_tokens=400, api_key=OPENAI_API_KEY)
        fb_chain   = EMO_PROMPT   | fb | parser
        fb_force   = FORCE_PROMPT | fb | parser
        raw = fb_chain.invoke({"transcript": transcript})
        items = _parse_emo_json(raw)
        if not items:
            raw = fb_force.invoke({"transcript": transcript})
            items = _parse_emo_json(raw)
    except Exception:
        items = []
    return items

def build_psych_bullets_from_items(items: List[Dict]) -> str:
    if not items:
        return ""
    lines = []
    for it in items:
        emo = it["emotion"]
        ev  = it["evidence_sentences"][0]
        kws = ", ".join(it["keywords"][:6])
        lines.append(f"- {emo}\n  - 근거문장 : “{ev}”\n  - 키워드 : [{kws}]")
    return "\n".join(lines)

# -------------------------------
# 7) 요약 & 구조화 요약
# -------------------------------
SYSTEM_PERSONA = '''\
당신은 한국어로 상담하는 의학(치매진단) 상담 챗봇입니다.
- 역할: 환자/보호자의 서술(STT 텍스트)을 읽고, 지정된 템플릿으로 간결하고 체계적인 요약을 만듭니다.
- 태도: 정중하고 전문적이며, 과도한 확신/진단을 피하고 안전수칙을 강조합니다.
- 범위: 치매, 경도인지장애, 관련 증상/검사/일상 안전/가족 교육에 한정합니다.
- 금지: 무관한 정보는 생성 금지.
- 출력: 반드시 아래 '요약 템플릿'의 <요약> 섹션만 출력합니다. (<질문>, <STT>는 출력 금지)
'''

SUMMARY_TEMPLATE = '''\
<요약>
1. **주 증상**
{symptoms_bullets}

2. **상담내용**
{counselling_bullets}

3. **심리상태**
{psych_bullets}

4. **AI 해석**
{ai_interp_bullets}

5. **주의사항**
{caution_bullets}
'''

SUMMARISE_PROMPT = ChatPromptTemplate.from_messages(
    [
      ("system", SYSTEM_PERSONA + "\n\n"
        "아래 '참고 문서(요약)'는 참고용입니다. "
        "근거가 불명확하면 단정 대신 조심스러운 해석을 제시하세요.\n"
        "반드시 '요약 템플릿' 구조를 유지하며 <요약> 섹션만 출력하십시오."),
      ("human",
       "가이드 질문(고정 4개 중 선택): {guide_question}\n\n"
       "참고 문서(요약):\n{rag_context}\n\n"
       "사용자 STT 원문:\n{transcript}\n\n"
       "요구사항:\n"
       "1) '주 증상'은 '-' 불릿으로 핵심만.\n"
       "2) '상담내용'은 구체 사례 중심 불릿.\n"
       "3) '심리상태'는 **아래 제공된 불릿을 그대로 사용**(문구/순서 변경 금지). 비어있으면 스스로 작성.\n"
       "   제공 불릿:\n{psych_bullets_fixed}\n"
       "4) 'AI 해석'은 병명 단정 금지(예: '~가능성 시사').\n"
       "5) '주의사항'은 안전/정서지지/검진 권고 포함.\n"
       "6) 아래 형식으로 출력(오직 <요약> 섹션만):\n"
       "{summary_template}\n"
       "출력 시 한국어 따옴표(“)를 유지하세요."
      )
    ]
)

ROBUST_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
      ("system", SYSTEM_PERSONA + "\n\n"
        "출력이 비어 있거나 형식을 따르지 않으면 즉시 N/A로 채우고 템플릿을 완성하세요. "
        "어떠한 경우에도 빈 문자열을 출력하지 마세요."),
      ("human",
       "가이드 질문: {guide_question}\n\n"
       "참고 문서(요약):\n{rag_context}\n\n"
       "사용자 STT 원문:\n{transcript}\n\n"
       "심리상태 제공 불릿(있으면 그대로 사용):\n{psych_bullets_fixed}\n\n"
       "아래 형식으로만 출력하세요:\n{summary_template}")
    ]
)

JSON_SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "입력에 기반하여 다음 필드를 갖는 JSON 객체만 출력하라:\n"
     "{"
     "\"primary_symptoms\": [\"...\"], "
     "\"counselling\": [\"...\"], "
     "\"psych\": [{\"emotion\":\"...\",\"evidence\":\"...\",\"keywords\":[\"...\"]}], "
     "\"ai_interpretation\": [\"...\"], "
     "\"cautions\": [\"...\"]"
     "}\n"
     "psych는 제공된 psych_items를 그대로 사용하고, 나머지는 STT와 참고 문서에서 요약하라."),
    ("human",
     "STT:\n{transcript}\n\n"
     "참고 문서(요약):\n{rag_context}\n\n"
     "psych_items(JSON):\n{psych_items_json}\n\n"
     "오직 JSON 객체만 출력:")
])

def _make_summary_chain(llm_summary: ChatOpenAI):
    return SUMMARISE_PROMPT | llm_summary | StrOutputParser()

def _make_json_summary_chain(llm_summary: ChatOpenAI):
    return JSON_SUMMARY_PROMPT | llm_summary | StrOutputParser()

# -------------------------------
# 8) 파이프라인 함수
# -------------------------------
def run_summarisation_pipeline(
    transcript: str,
    guide_question_index: int = 3,
    session_id: Optional[str] = None,
    chat_model: Optional[str] = None,
    embed_model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    models: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:

    clients = _build_clients(
        chat_model=chat_model,
        embed_model=embed_model,
        temperature=temperature,
        max_tokens=max_tokens,
        models=models,
    )

    # ❶ 세그먼트 정책 적용
    seg_policy = apply_topic_policy(transcript, judge_llm=clients.llm_judge)
    if seg_policy["label"] == "off_topic":
        _update_session(session_id, "off_topic", 0.0)
        return {
            "status": "off_topic",
            "on_topic_prob": 0.0,
            "message": OFF_TOPIC_MESSAGE,
            "summarized_text": OFF_TOPIC_MESSAGE,
            "policy": {
                "coverage": seg_policy["coverage"],
                "dropped_segments": seg_policy["dropped_segments"],
                "offdomain": seg_policy["offdomain"],
                "segments": seg_policy.get("segments", [])
            },
            "used_models": clients.model_ids
        }

    if seg_policy["label"] == "partial":
        working_transcript = seg_policy["filtered_text"] or transcript.strip()
        mix_msg = "치매와 무관한 요청(예: 일반 메뉴 추천 등)은 제외하고 요약했습니다."
    else:
        working_transcript = transcript.strip()
        mix_msg = ""

    # ❷ 로그용 prior 업데이트
    det = detect_topic(working_transcript, judge_llm=clients.llm_judge, session_id=session_id)
    _update_session(session_id, det["label"], float(det["prob"]))

    # ❸ RAG
    guide_question = GUIDE_QUESTIONS[max(0, min(3, int(guide_question_index)))]
    queries = make_search_queries(working_transcript, clients.llm_query)
    rag_context, rag_sources = build_rag_context_rerank(working_transcript, queries, clients.embeddings)

    # ❹ 감정/근거/키워드
    psych_items = extract_emotions_with_keywords(working_transcript, clients.llm_emo)
    psych_bullets_fixed = build_psych_bullets_from_items(psych_items)

    # ❺ 요약 (빈 출력 방지: 강건 프롬프트 → mini 폴백)
    summary_chain = _make_summary_chain(clients.llm_summary)
    try:
        _raw_summary = summary_chain.invoke({
            "transcript": working_transcript,
            "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
            "guide_question": guide_question,
            "summary_template": SUMMARY_TEMPLATE,
            "psych_bullets_fixed": psych_bullets_fixed if psych_bullets_fixed else "(없음)",
        })
    except Exception:
        _raw_summary = ""

    def _ensure_summary_not_empty(summary_text: str) -> Tuple[str, str, bool]:
        if summary_text and summary_text.strip():
            return summary_text.strip(), clients.model_ids["summary"], False
        # 같은 모델 + 강건 프롬프트
        try:
            robust_chain = ROBUST_SUMMARY_PROMPT | clients.llm_summary | StrOutputParser()
            s2 = robust_chain.invoke({
                "transcript": working_transcript,
                "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
                "guide_question": guide_question,
                "summary_template": SUMMARY_TEMPLATE,
                "psych_bullets_fixed": psych_bullets_fixed or "(없음)",
            }).strip()
        except Exception:
            s2 = ""
        if s2:
            return s2, clients.model_ids["summary"], False
        # 폴백: gpt-4o-mini
        alt = _build_clients(chat_model="gpt-4o-mini",
                             embed_model=clients.model_ids["embed"],
                             temperature=clients.temperature,
                             max_tokens=clients.max_tokens)
        try:
            alt_chain = ROBUST_SUMMARY_PROMPT | alt.llm_summary | StrOutputParser()
            s3 = alt_chain.invoke({
                "transcript": working_transcript,
                "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
                "guide_question": guide_question,
                "summary_template": SUMMARY_TEMPLATE,
                "psych_bullets_fixed": psych_bullets_fixed or "(없음)",
            }).strip()
        except Exception:
            s3 = ""
        return s3, alt.model_ids["summary"], True

    summary_text, summary_model_used, did_fb = _ensure_summary_not_empty(_raw_summary)

    # ❻ 구조화 요약(JSON) — BEGIN REPLACE
    def __loose_json_loads(text: str) -> dict:
        """코드펜스/스마트따옴표/트레일링 콤마가 있어도 최대한 파싱"""
        if not text:
            raise ValueError("empty")
        t = text.strip()
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
        m = re.search(r"\{.*\}", t, flags=re.DOTALL)
        if not m:
            raise ValueError("no-json-object")
        s = m.group(0)
        s = s.replace("“", "\"").replace("”", "\"").replace("’", "'").replace("‘", "'")
        s = re.sub(r",(\s*[}\]])", r"\1", s)
        return json.loads(s)

    def __json_mode_chat(model_id: str):
        """JSON 전용 응답 강제 (langchain-openai 버전 호환)"""
        try:
            return ChatOpenAI(
                model=model_id,
                temperature=clients.temperature,
                max_tokens=clients.max_tokens,
                api_key=OPENAI_API_KEY,
                model_kwargs={"response_format": {"type": "json_object"}}
            )
        except TypeError:
            # 일부 버전은 extra_body 사용
            return ChatOpenAI(
                model=model_id,
                temperature=clients.temperature,
                max_tokens=clients.max_tokens,
                api_key=OPENAI_API_KEY,
                extra_body={"response_format": {"type": "json_object"}}
            )

    def _make_json_chain_with_model(model_id: str) -> Any:
        return _make_json_summary_chain(__json_mode_chat(model_id))

    def __structured_from_summary_text(summary_text: str) -> Dict[str, Any]:
        """
        <요약> 텍스트를 다시 파싱해 구조화. 심리상태는
        - "근거문장 :" / "키워드 :" 라인이 있으면 매핑, 없으면 감정만 채움.
        """
        data = {
            "primary_symptoms": [],
            "counselling": [],
            "psych": [],
            "ai_interpretation": [],
            "cautions": []
        }
        cur = None
        last_psych = None

        for line in summary_text.splitlines():
            s = line.strip()
            if not s:
                continue

            # 섹션 전환
            if "주 증상" in s:
                cur = "primary_symptoms"; last_psych = None; continue
            if "상담내용" in s:
                cur = "counselling"; last_psych = None; continue
            if "심리상태" in s:
                cur = "psych"; last_psych = None; continue
            if "AI 해석" in s:
                cur = "ai_interpretation"; last_psych = None; continue
            if "주의사항" in s:
                cur = "cautions"; last_psych = None; continue

            # 불릿 아이템
            if s.startswith("-"):
                item = s[1:].strip()
                if not item or item == "(없음)":
                    continue
                if cur == "psych":
                    # 하위 라인(근거문장/키워드)이 뒤따를 수 있으니 객체 생성
                    obj = {"emotion": item, "evidence": "", "keywords": []}
                    data["psych"].append(obj)
                    last_psych = obj
                elif cur:
                    data[cur].append(item)
                continue

            # 심리상태 하위 속성(근거문장/키워드)
            if cur == "psych" and last_psych:
                m_ev = re.search(r"근거문장\s*:\s*[\"“]?(.+?)[\"”]?$", s)
                if m_ev:
                    last_psych["evidence"] = m_ev.group(1).strip()
                    continue
                m_kw = re.search(r"키워드\s*:\s*\[(.+)\]$", s)
                if m_kw:
                    toks = [k.strip() for k in m_kw.group(1).split(",")]
                    last_psych["keywords"] = [k for k in toks if k]
                    continue

        return data

    def __ensure_psych_if_empty(structured: Dict[str, Any], text_src: str):
        """심리상태가 비었으면 간단 휴리스틱으로 최소 1개 채움"""
        if structured.get("psych"):
            return
        emo_map = [
            ("무섭", "두려움"), ("두렵", "두려움"),
            ("걱정", "걱정"), ("불안", "불안감"),
            ("창피", "수치심"), ("부끄", "수치심"),
            ("답답", "답답함")
        ]
        added = []
        # 문장 단위 분리
        sents = re.split(r"[.!?\n]+", text_src)
        for kw, emo in emo_map:
            if any(kw in sen for sen in sents):
                ev = ""
                for sen in sents:
                    if kw in sen and 6 <= len(sen.strip()) <= 120:
                        ev = sen.strip()
                        break
                structured.setdefault("psych", []).append(
                    {"emotion": emo, "evidence": ev, "keywords": [kw]}
                )
                added.append(emo)
                break  # 최소 1개만 보장

    # 1차: 실제 요약에 사용한 모델로 JSON 생성(엄격 JSON 모드)
    try:
        json_summary_chain = _make_json_chain_with_model(summary_model_used)
        structured_raw = json_summary_chain.invoke({
            "transcript": working_transcript,
            "rag_context": rag_context.strip() if rag_context else "",
            "psych_items_json": json.dumps(psych_items, ensure_ascii=False),
        })
        structured = __loose_json_loads(structured_raw)
    except Exception:
        # 2차: 폴백(gpt-4o-mini)로 재시도
        try:
            json_summary_chain = _make_json_chain_with_model("gpt-4o-mini")
            structured_raw = json_summary_chain.invoke({
                "transcript": working_transcript,
                "rag_context": rag_context.strip() if rag_context else "",
                "psych_items_json": json.dumps(psych_items, ensure_ascii=False),
            })
            structured = __loose_json_loads(structured_raw)
        except Exception:
            # 최종 폴백: 요약 텍스트에서 재구성
            structured = __structured_from_summary_text(summary_text)

    # 심리상태 비었으면 최소 한 항목 보강
    __ensure_psych_if_empty(structured, working_transcript)
    # ❻ 구조화 요약(JSON) — END REPLACE


    return {
        "status": "ok",
        "on_topic_prob": seg_policy.get("coverage", 1.0),
        "question_used": guide_question,
        "evidence_spans": [],
        "rag_sources": rag_sources,
        "psych_items": psych_items,
        "summarized_text": summary_text,
        "summary_structured": structured,
        "policy": {
            "label": seg_policy["label"],
            "coverage": seg_policy["coverage"],
            "dropped_segments": seg_policy["dropped_segments"],
            "offdomain": seg_policy["offdomain"],
            "segments": seg_policy.get("segments", []),
            "notice": mix_msg
        },
        "used_models": {
            "summary": summary_model_used,
            "judge":   clients.model_ids["judge"],
            "emotion": clients.model_ids["emotion"],
            "query":   clients.model_ids["query"],
            "embed":   clients.model_ids["embed"],
            "fallback_applied": did_fb
        },
        "temperature": clients.temperature,
        "max_tokens":  clients.max_tokens
    }

def summarise_from_file(
    file_path: str,
    guide_question_index: int = 3,
    session_id: Optional[str] = None,
    **model_overrides
) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"입력 파일이 존재하지 않습니다: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        transcript = f.read().strip()
    mark_guide_question_shown(session_id)
    return run_summarisation_pipeline(transcript, guide_question_index, session_id, **model_overrides)

# -------------------------------
# 음성 챗봇 전용 분석 함수
# -------------------------------
def analyze_voice_response(
    user_response: str,
    question_context: str = "",
    session_id: Optional[str] = None,
    user_id: str = "",
    chat_model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """
    음성 챗봇 전용 - 사용자 답변 분석 및 상담 제공
    
    Args:
        user_response: 사용자의 음성 답변 텍스트
        question_context: 질문 맥락 (예: "자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?")
        session_id: 세션 ID
        user_id: 사용자 ID
        chat_model: 사용할 챗봇 모델
        temperature: 온도 설정
        max_tokens: 최대 토큰 수
        
    Returns:
        분석 결과 딕셔너리
    """
    
    # 클라이언트 설정
    clients = _build_clients(
        chat_model=chat_model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    
    # 온토픽 감지
    topic_result = detect_topic(user_response, clients.llm_judge, session_id)
    
    # 치매 관련이 아닌 경우
    if topic_result["label"] == "off_topic":
        return {
            "status": "off_topic",
            "message": OFF_TOPIC_MESSAGE,
            "analysis": {
                "topic_detection": topic_result,
                "user_response": user_response,
                "question_context": question_context
            }
        }
    
    # 심리상태 분석 프롬프트
    PSYCH_ANALYSIS_PROMPT = ChatPromptTemplate.from_messages([
        ("system", 
         "당신은 치매 관련 상담을 전문으로 하는 심리상담사입니다. "
         "사용자의 답변을 분석하여 심리상태를 파악하고 상담을 제공하세요.\n\n"
         "출력 형식:\n"
         "{{\n"
         "  \"emotional_state\": \"주요 감정 상태 (예: 걱정, 두려움, 당황, 수치심 등)\",\n"
         "  \"symptom_severity\": \"증상 심각도 (경미/보통/심각)\",\n"
         "  \"key_concerns\": [\"주요 우려사항 1\", \"주요 우려사항 2\"],\n"
         "  \"coping_strategies\": [\"대처 방법 1\", \"대처 방법 2\"],\n"
         "  \"professional_advice\": \"전문가 상담 권장 여부 (예: 즉시/1주일 내/1개월 내/상담 불필요)\"\n"
         "}}"),
        ("human", 
         f"질문: {question_context}\n"
         f"사용자 답변: {user_response}\n\n"
         "위 답변을 분석하여 JSON 형태로 응답해주세요.")
    ])
    
    # 요약 프롬프트
    SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
        ("system",
         "당신은 치매 관련 상담을 전문으로 하는 의료진입니다. "
         "사용자의 답변을 간결하게 요약하고 핵심 내용을 추출하세요.\n\n"
         "출력 형식:\n"
         "{{\n"
         "  \"main_points\": [\"핵심 내용 1\", \"핵심 내용 2\"],\n"
         "  \"symptom_description\": \"증상에 대한 구체적 설명\",\n"
         "  \"impact_on_daily_life\": \"일상생활에 미치는 영향\",\n"
         "  \"frequency\": \"증상 발생 빈도 (예: 가끔/자주/매일)\"\n"
         "}}"),
        ("human",
         f"질문: {question_context}\n"
         f"사용자 답변: {user_response}\n\n"
         "위 답변을 요약하여 JSON 형태로 응답해주세요.")
    ])
    
    # 주의사항 프롬프트
    CAUTION_PROMPT = ChatPromptTemplate.from_messages([
        ("system",
         "당신은 치매 관련 상담을 전문으로 하는 의료진입니다. "
         "사용자의 답변을 바탕으로 주의사항과 권장사항을 제공하세요.\n\n"
         "출력 형식:\n"
         "{{\n"
         "  \"immediate_actions\": [\"즉시 취해야 할 행동 1\", \"즉시 취해야 할 행동 2\"],\n"
         "  \"safety_measures\": [\"안전 조치 1\", \"안전 조치 2\"],\n"
         "  \"monitoring_points\": [\"관찰해야 할 점 1\", \"관찰해야 할 점 2\"],\n"
         "  \"when_to_seek_help\": \"언제 전문가 도움을 받아야 하는지\",\n"
         "  \"family_guidance\": \"가족이 취해야 할 조치\"\n"
         "}}"),
        ("human",
         f"질문: {question_context}\n"
         f"사용자 답변: {user_response}\n\n"
         "위 답변을 바탕으로 주의사항을 JSON 형태로 응답해주세요.")
    ])
    
    try:
        # 각 분석 실행
        psych_chain = PSYCH_ANALYSIS_PROMPT | clients.llm_emo | StrOutputParser()
        summary_chain = SUMMARY_PROMPT | clients.llm_summary | StrOutputParser()
        caution_chain = CAUTION_PROMPT | clients.llm_summary | StrOutputParser()
        
        # 병렬로 분석 실행 (실제로는 순차 실행)
        psych_result = psych_chain.invoke({})
        summary_result = summary_chain.invoke({})
        caution_result = caution_chain.invoke({})
        
        # JSON 파싱
        try:
            psych_data = _json_loose_loads(psych_result)
        except:
            psych_data = {"error": "심리상태 분석 파싱 실패"}
            
        try:
            summary_data = _json_loose_loads(summary_result)
        except:
            summary_data = {"error": "요약 분석 파싱 실패"}
            
        try:
            caution_data = _json_loose_loads(caution_result)
        except:
            caution_data = {"error": "주의사항 분석 파싱 실패"}
        
        # 결과 구성
        result = {
            "status": "success",
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": time.time(),
            "question_context": question_context,
            "user_response": user_response,
            "topic_detection": topic_result,
            "analysis": {
                "summary": summary_data,
                "psychological_state": psych_data,
                "cautions": caution_data
            },
            "model_info": {
                "chat_model": clients.model_ids["summary"],
                "temperature": clients.temperature,
                "max_tokens": clients.max_tokens
            }
        }
        
        return result
        
    except Exception as e:
        print(f"음성 응답 분석 오류: {e}")
        return {
            "status": "error",
            "error": str(e),
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": time.time()
        }
