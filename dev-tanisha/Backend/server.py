from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import base64
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database ─────────────────────────────────────────────────────────────────

def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
        cursor_factory=RealDictCursor
    )

def create_table():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("CREATE SCHEMA IF NOT EXISTS public")
    cur.execute("DROP TABLE IF EXISTS public.jira_connections")
    cur.execute("""
        CREATE TABLE public.jira_connections (
            id SERIAL PRIMARY KEY,
            instance_url VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Table ready!")

create_table()

# ─── Models ───────────────────────────────────────────────────────────────────

class ConnectRequest(BaseModel):
    instanceUrl: str
    email: str
    apiToken: str

class FetchIssuesRequest(BaseModel):
    instanceUrl: str
    email: str
    apiToken: str
    search: Optional[str] = None

# ─── Helper ───────────────────────────────────────────────────────────────────

def get_auth_header(email: str, api_token: str) -> str:
    token = base64.b64encode(f"{email}:{api_token}".encode()).decode()
    return f"Basic {token}"

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.post("/api/connect")
async def connect(req: ConnectRequest):
    auth_header = get_auth_header(req.email, req.apiToken)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{req.instanceUrl}/rest/api/3/myself",
                headers={"Authorization": auth_header, "Accept": "application/json"},
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Connection failed!")

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO public.jira_connections (instance_url, email) VALUES (%s, %s)",
            [req.instanceUrl, req.email]
        )
        conn.commit()
        cur.close()
        conn.close()

        return {"success": True, "message": "Connected to Jira!"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Connect error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fetch-issues")
async def fetch_issues(req: FetchIssuesRequest):
    auth_header = get_auth_header(req.email, req.apiToken)
    try:
        jql = (
            f'text ~ "{req.search}" ORDER BY created DESC'
            if req.search
            else "project is not EMPTY ORDER BY created DESC"
        )
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{req.instanceUrl}/rest/api/3/search/jql",
                headers={"Authorization": auth_header, "Accept": "application/json"},
                params={
                    "jql": jql,
                    "maxResults": 20,
                    "fields": "summary,status,priority,assignee,created,issuetype,project",
                },
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch issues!")

        return {"success": True, "issues": response.json().get("issues", [])}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Fetch error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)