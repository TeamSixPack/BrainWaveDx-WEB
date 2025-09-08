from fastapi import FastAPI, Response
import os, httpx, json

app = FastAPI()
BASE = os.getenv("SPRING_BASE_URL", "http://spring:8090")

async def try_get(path: str):
    try:
        async with httpx.AsyncClient(timeout=2.0) as c:
            r = await c.get(BASE + path)
            return r.status_code, r
    except Exception:
        return 0, None

@app.get("/actuator/health")
async def actuator_health():
    # 1) 스프링에 진짜 액추에이터가 있으면 그대로 패스스루
    for p in ("/actuator/health", "/api/actuator/health"):
        code, r = await try_get(p)
        if code == 200 and r is not None:
            ct = r.headers.get("content-type", "application/json")
            return Response(content=r.content, media_type=ct, status_code=200)

    # 2) 없으면 대체 헬스: 루트/포트 응답만으로 UP/DOWN 판단
    code, _ = await try_get("/")
    status = "UP" if code and code < 500 else "DOWN"
    body = {"status": status, "spring_http": code}
    return Response(content=json.dumps(body), media_type="application/json", status_code=(200 if status=="UP" else 503))
