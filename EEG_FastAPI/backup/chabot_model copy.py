# -*- coding: utf-8 -*-
"""
chabot_model.py
- LLM + LangChain + RAG 파이프라인
- 온토픽 감지(LLM), 감정/근거/키워드 추출(LLM), 요약(<요약> 섹션), 구조적 JSON 요약
- ✅ 모델 동적 선택 지원: 요청에서 chat_model/embed_model/temperature/max_tokens 또는 models{}로 오버라이드
"""

import os, json, re, time
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

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

# 기본값 (요청에서 오버라이드 가능)
DEFAULT_CHAT_MODEL  = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
DEFAULT_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
DEFAULT_TEMPERATURE = float(os.getenv("TEMPERATURE", "0.2"))
DEFAULT_MAX_TOKENS  = int(os.getenv("MAX_OUTPUT_TOKENS", "800"))

OFF_TOPIC_MESSAGE = "치매관련 상담만 가능합니다."

# 고정 질문
Q1 = '자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?'
Q2 = '대화중단어가 잘 떠오르지 않아서 곤란했던 적이 있나요?'
Q3 = '가족이나 지인이 평소와 다르다고 한적이 있나요?'
Q4 = '최근에 불편했던 점이나 걱정되는 점이 있나요?'
GUIDE_QUESTIONS = [Q1, Q2, Q3, Q4]

# 선택 가능한 모델 예시 (주석: 실제 사용 가능 여부는 계정/권한/버전에 따라 다름)
# CHAT 모델 예시:
#   "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini", "o4-mini"
# EMBEDDING 모델 예시:
#   "text-embedding-3-small", "text-embedding-3-large"

# # -------------------------------
# 모델/클라이언트 구성체  (교체)
# -------------------------------
from dataclasses import dataclass

@dataclass
class ClientBundle:
    llm_summary: ChatOpenAI
    llm_judge:   ChatOpenAI
    llm_query:   ChatOpenAI
    llm_emo:     ChatOpenAI
    embeddings:  OpenAIEmbeddings
    temperature: float
    max_tokens:  int
    model_ids:   Dict[str, str]  # 보고용 실제 모델 문자열

def _normalise_model_id(mid: Optional[str]) -> Optional[str]:
    """자주 틀리는 표기를 표준 아이디로 보정"""
    if not mid:
        return None
    m = mid.strip()

    # 공통 오타/별칭 → 표준
    aliases = {
        # 4o 계열
        "gpt-o4": "gpt-4o",
        "gpt4o": "gpt-4o",
        "gpt-4-omni": "gpt-4o",
        "4o": "gpt-4o",
        "o4": "o4-mini",   # OpenAI 최신 naming을 쓰는 경우에 대비한 안전 폴백
        "o4-mini": "o4-mini",

        # 4.1 계열
        "gpt-4.1mini": "gpt-4.1-mini",
        "gpt-4.1-mini": "gpt-4.1-mini",

        # 5 계열(있다고 가정하는 입력은 4o-mini로 폴백)
        "gpt5": "gpt-5",
        "gpt5-mini": "gpt-5-mini",
        "gpt5-nano": "gpt-5-nano",

        # 임베딩
        "text-embedding-3small": "text-embedding-3-small",
        "text-embedding-3large": "text-embedding-3-large",
    }
    m = aliases.get(m, m)

    # 허용 리스트 (알 수 없는 모델명 들어오면 안전 폴백)
    allowed = {
        "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini",
        "gpt-5", "gpt-5-mini", "gpt-5-nano",
        "text-embedding-3-small", "text-embedding-3-large"
    }
    if m not in allowed:
        # 알 수 없는 이름이면 가장 안전한 기본값으로
        if m.startswith("text-embedding"):
            return "text-embedding-3-small"
        return "gpt-4o-mini"
    return m


def _name_of_chat_model(llm: ChatOpenAI) -> str:
    """langchain-openai 버전에 따라 모델 속성명이 다름을 안전 처리"""
    return getattr(llm, "model", getattr(llm, "model_name", "unknown"))

def _name_of_embed_model(emb: OpenAIEmbeddings) -> str:
    return getattr(emb, "model", getattr(emb, "model_name", "unknown"))

def _build_clients(
    chat_model: Optional[str] = None,
    embed_model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    models: Optional[Dict[str, str]] = None,
) -> ClientBundle:
    """
    models: {"summary": "...", "judge": "...", "emotion": "...", "query": "...", "embed": "..."}
    지정이 없으면 chat_model/embed_model(또는 기본값)으로 채움
    """
    cm_in  = _normalise_model_id(chat_model  or DEFAULT_CHAT_MODEL)
    em_in  = _normalise_model_id(embed_model or DEFAULT_EMBED_MODEL)
    tmp = DEFAULT_TEMPERATURE if temperature is None else float(temperature)
    mx  = DEFAULT_MAX_TOKENS  if max_tokens  is None else int(max_tokens)

    m_summary = m_judge = m_query = m_emo = cm_in
    m_embed   = em_in

    if models and isinstance(models, dict):
        m_summary = _normalise_model_id(models.get("summary", m_summary))
        m_judge   = _normalise_model_id(models.get("judge",   m_judge))
        m_query   = _normalise_model_id(models.get("query",   m_query))
        m_emo     = _normalise_model_id(models.get("emotion", m_emo))
        m_embed   = _normalise_model_id(models.get("embed",   m_embed))

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
# 2) 온토픽 감지(LLM 기반) — 프롬프트
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
    prior = _get_session(session_id)["prior"]
    try:
        raw = judge_chain.invoke({"user_text": t})
        data = json.loads(raw)
        score = float(data.get("score", 0.5))
        evid  = [e for e in (data.get("evidence_spans") or []) if isinstance(e, str)]
        combined = max(0.0, min(1.0, 0.65 * score + 0.35 * prior))
    except Exception:
        evid = []
        combined = prior
    if combined >= TAU_ON:
        label = "on_topic"
    elif BAND[0] <= combined < BAND[1]:
        label = "abstain"
    else:
        label = "off_topic"
    return {"label": label, "prob": combined, "evidence": evid}

# -------------------------------
# 2.5) 세그먼트 단위 토픽 감지 + 비치매성 요청 감지 (LLM 기반)
# -------------------------------
from langchain_core.output_parsers import StrOutputParser

# ---------- 세그먼트 단위 판별 (few-shot) ----------
SEGMENT_CLASSIFY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "너는 문장이 ‘치매/인지장애 상담’에 해당하는지 판단하는 분류기다.\n"
     "판단 기준: (a) 기억저하/단어회상곤란/언어유창성 저하/길잃음/방향감각 문제/일상생활 곤란/정서반응(불안·두려움·수치심 등) 중 "
     "적어도 하나의 **구체적 경험/우려**가 나타나면 on_topic이다. 일상 추천/메뉴 선택/광고/가격/일반 수다 등은 off_topic.\n"
     "오직 JSON: {\"on_topic\": true|false, \"score\": 0.0~1.0}"),

    # ✅ few-shot 예시들
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

    # 실제 입력
    ("human", "문장:\n\"\"\"\n{sent}\n\"\"\"\n오직 JSON:")
])
_segment_judge_parser = StrOutputParser()

OFFDOMAIN_TASK_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "입력이 ‘치매상담’ 이외의 **실제 과업 요청**(예: 메뉴 추천, 식당/음식/쇼핑/가격/영양/쿠폰/광고/게임/코딩/날씨 등)을 포함하는지 판정하라.\n"
     "오직 JSON: {\"non_dementia_task\": true|false, \"spans\": [\"...\", \"...\"]}"),
    ("human", "입력:\n\"\"\"\n{whole}\n\"\"\"\n오직 JSON:")
])
_offdomain_parser = StrOutputParser()

def _split_into_segments(text: str) -> List[str]:
    # 줄바꿈/마침표/물음표/느낌표/번호 구분으로 분할
    raw = re.split(r"(?:\n+|[.!?]+|\r+|^\s*\d+[.)]\s*)", text)
    segs = [s.strip() for s in raw if s and s.strip()]
    return [s for s in segs if len(s) >= 2]  # 너무 짧은 파편만 제거

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

# ✅ 최후 안전망(휴리스틱 rescue): 전부 off로 떨어질 때만 발동
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

    # off-domain 실제 과업요청(메뉴 추천 등) 감지
    offd = detect_offdomain_task(text, judge_llm)

    # 모두 off로 나온 경우에만, 고정어가 아닌 **고정폭 주제 신호**로 rescue
    if len(on) == 0 and RESCUE_TRIGGERS.search(text):
        on = segs  # 전부 온토픽으로 보진 말고, 원문 그대로 한 번 더 시도
        coverage = 1.0

    # 임계값(완화): 강한 on 세그먼트 존재 시 on_topic
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
        "segments": segs  # 디버그/로깅용
    }


# -------------------------------
# 3) 검색 → RAG 컨텍스트
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
    # 필요 시 Bing/Google/SerpAPI 추가 연결 지점
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
# 4) 감정/근거/키워드 추출(LLM)
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
        try:
            data = json.loads(raw)
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
                        kws.extend(_top_keywords_from_text(e, k=4))
                kws = list(dict.fromkeys([k for k in kws if 1 <= len(k) <= 20]))[:8]
                if not kws:
                    kws = _top_keywords_from_text(" ".join(evs), k=5)
                items.append({"emotion": emo, "evidence_sentences": evs, "keywords": kws})
            return items[:4]
        except Exception:
            return []

    raw = emo_chain.invoke({"transcript": transcript})
    items = _parse_emo_json(raw)
    if not items:
        raw2 = force_chain.invoke({"transcript": transcript})
        items = _parse_emo_json(raw2)
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
# 5) 요약 프롬프트 및 구조화 요약
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

# ------- (추가) 빈 요약 방지용: 재시도 & 폴백 모델 -------
def _fallback_for(model_id: str) -> str:
    # gpt-5 → gpt-5-mini → gpt-5-nano → gpt-4o-mini 순
    if model_id.startswith("gpt-5"):
        return "gpt-5-mini" if model_id != "gpt-5-mini" else "gpt-5-nano"
    return "gpt-4o-mini"

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

def _ensure_summary_not_empty(summary_text: str,
                              transcript: str,
                              rag_context: str,
                              guide_question: str,
                              psych_bullets_fixed: str,
                              clients: ClientBundle) -> Tuple[str, str, bool]:
    """
    빈 출력 시: (1) 강건 프롬프트로 재시도 → (2) 폴백 모델로 재시도.
    반환: (summary, actually_used_model_id, did_fallback)
    """
    if summary_text and summary_text.strip():
        return summary_text.strip(), clients.model_ids["summary"], False

    # 1) 같은 모델 + 강건 프롬프트
    robust_chain = ROBUST_SUMMARY_PROMPT | clients.llm_summary | StrOutputParser()
    s2 = robust_chain.invoke({
        "transcript": transcript.strip(),
        "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
        "guide_question": guide_question,
        "summary_template": SUMMARY_TEMPLATE,
        "psych_bullets_fixed": psych_bullets_fixed or "(없음)",
    }).strip()
    if s2:
        return s2, clients.model_ids["summary"], False

    # 2) 폴백 모델로 재시도
    fb_model = _fallback_for(clients.model_ids["summary"])
    alt = _build_clients(chat_model=fb_model,
                         embed_model=clients.model_ids["embed"],
                         temperature=clients.temperature,
                         max_tokens=clients.max_tokens)
    alt_chain = ROBUST_SUMMARY_PROMPT | alt.llm_summary | StrOutputParser()
    s3 = alt_chain.invoke({
        "transcript": transcript.strip(),
        "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
        "guide_question": guide_question,
        "summary_template": SUMMARY_TEMPLATE,
        "psych_bullets_fixed": psych_bullets_fixed or "(없음)",
    }).strip()
    return s3, alt.model_ids["summary"], True



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

def _make_summary_chain(llm_summary: ChatOpenAI) -> Any:
    return SUMMARISE_PROMPT | llm_summary | StrOutputParser()

def _make_json_summary_chain(llm_summary: ChatOpenAI) -> Any:
    return JSON_SUMMARY_PROMPT | llm_summary | StrOutputParser()

# -------------------------------
# 6) 파이프라인 함수 (모델 오버라이드 지원)
# -------------------------------
def run_summarisation_pipeline(...):
    clients = _build_clients(
        chat_model=chat_model,
        embed_model=embed_model,
        temperature=temperature,
        max_tokens=max_tokens,
        models=models,
    )

    # ❶ 먼저 세그먼트 정책 적용 (오프토픽/혼합/온토픽 결정)
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

    # ❷ 혼합이면 비관련 세그먼트 제거 후 진행
    if seg_policy["label"] == "partial":
        working_transcript = seg_policy["filtered_text"] or transcript.strip()
        mix_msg = "치매와 무관한 요청(예: 일반 메뉴 추천 등)은 제외하고 요약했습니다."
    else:
        working_transcript = transcript.strip()
        mix_msg = ""

    # ❸ (선택) 전체문장 on/off 로그용 판별 — 세션 prior 업데이트에만 사용
    det = detect_topic(working_transcript, judge_llm=clients.llm_judge, session_id=session_id)
    _update_session(session_id, det["label"], float(det["prob"]))


    if label == "off_topic":
        return {
            "status": "off_topic",
            "on_topic_prob": prob,
            "message": OFF_TOPIC_MESSAGE,
            "summarized_text": OFF_TOPIC_MESSAGE,
            "used_models": clients.names
        }
    if label == "abstain":
        msg = "치매 관련 증상·경험 중심으로 조금만 더 구체적으로 말씀해 주시면 요약을 도와드리겠습니다."
        return {
            "status": "need_more_detail",
            "on_topic_prob": prob,
            "message": msg,
            "summarized_text": msg,
            "used_models": clients.names
        }

    # --- 세그먼트 단위 정책 먼저 적용 ---
    seg_policy = apply_topic_policy(transcript, judge_llm=clients.llm_judge)
    if seg_policy["label"] == "off_topic":
        _update_session(session_id, "off_topic", 0.0)
        return {
            "status": "off_topic",
            "on_topic_prob": 0.0,
            "message": OFF_TOPIC_MESSAGE,
            "summarized_text": OFF_TOPIC_MESSAGE,
            "policy": {"coverage": seg_policy["coverage"], "dropped_segments": seg_policy["dropped_segments"],
                       "offdomain": seg_policy["offdomain"]}
        }

    # 혼합 입력이면 비관련 세그먼트 제거 후 요약
    if seg_policy["label"] == "partial":
        filtered_transcript = seg_policy["filtered_text"].strip()
        if not filtered_transcript:
            _update_session(session_id, "off_topic", 0.0)
            return {
                "status": "off_topic",
                "on_topic_prob": 0.0,
                "message": OFF_TOPIC_MESSAGE,
                "summarized_text": OFF_TOPIC_MESSAGE,
                "policy": {"coverage": seg_policy["coverage"], "dropped_segments": seg_policy["dropped_segments"],
                           "offdomain": seg_policy["offdomain"]}
            }
        # 혼합이므로 안내 메시지 동봉
        mix_notice = "치매와 무관한 요청(예: 일반 메뉴 추천 등)은 제외하고 요약했습니다."
        # 이후 단계에서 이 filtered_transcript 를 사용
        working_transcript = filtered_transcript
        mix_msg = mix_notice
    else:
        working_transcript = transcript.strip()
        mix_msg = ""
    guide_question = GUIDE_QUESTIONS[max(0, min(3, int(guide_question_index)))]
    queries = make_search_queries(working_transcript, clients.llm_query)
    rag_context, rag_sources = build_rag_context_rerank(working_transcript, queries, clients.embeddings)

    psych_items = extract_emotions_with_keywords(working_transcript, clients.llm_emo)
    psych_bullets_fixed = build_psych_bullets_from_items(psych_items)

    # 요약 실행
    summary_chain = _make_summary_chain(clients.llm_summary)
    _raw_summary = summary_chain.invoke({
        "transcript": working_transcript,
        "rag_context": rag_context.strip() if rag_context else "(문맥 없음)",
        "guide_question": guide_question,
        "summary_template": SUMMARY_TEMPLATE,
        "psych_bullets_fixed": psych_bullets_fixed if psych_bullets_fixed else "(없음)",
    })
    summary_text, summary_model_used, did_fb = _ensure_summary_not_empty(
        _raw_summary, working_transcript, rag_context, guide_question, psych_bullets_fixed, clients
    )



    # 구조화 요약(JSON)
    json_summary_chain = _make_json_summary_chain(clients.llm_summary)
    try:
        structured_raw = json_summary_chain.invoke({
            "transcript": transcript.strip(),
            "rag_context": rag_context.strip() if rag_context else "",
            "psych_items_json": json.dumps(psych_items, ensure_ascii=False),
        })
        structured = json.loads(structured_raw)
    except Exception:
        structured = {
            "primary_symptoms": [],
            "counselling": [],
            "psych": [
                {
                    "emotion": it.get("emotion",""),
                    "evidence": (it.get("evidence_sentences") or [""])[0],
                    "keywords": it.get("keywords", [])
                } for it in psych_items
            ],
            "ai_interpretation": [],
            "cautions": []
        }

    return {
        "status": "ok",
        "on_topic_prob": seg_policy.get("coverage", 1.0),
        "question_used": guide_question,
        "evidence_spans": [],  # (원하시면 seg_policy의 on_topic 세그먼트 일부를 근거로 넣을 수 있음)
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
        "used_models": clients.model_ids,
        
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
    # 가이드 질문을 던진 것으로 간주 → prior boost
    mark_guide_question_shown(session_id)
    return run_summarisation_pipeline(transcript, guide_question_index, session_id, **model_overrides)
