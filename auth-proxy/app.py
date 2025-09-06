from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
import httpx

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"], max_age=1800)


@app.options("/auth/login")
async def options():
    return Response(status_code=204)

@app.post("/auth/login")
async def login(request: Request):
    try:
        ctype = request.headers.get("content-type","")
        if ctype.startswith("application/json"):
            body = await request.json()
        else:
            form = await request.form()
            body = dict(form)

        uid = body.get("uid") or body.get("username") or body.get("email") or body.get("userId")
        pw  = body.get("pw")  or body.get("password") or body.get("userPw")
        if not uid or not pw:
            return JSONResponse({"success": False, "message": "uid/pw required"}, status_code=400)

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post("http://spring:8090/api/login", data={"uid": uid, "pw": pw})
        return Response(content=r.content, status_code=r.status_code,
                        media_type=r.headers.get("content-type","application/json"))
    except Exception as e:
        return JSONResponse({"success": False, "message": f"adapter-error: {e}"}, status_code=500)
