from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import boto3
from botocore.exceptions import ClientError
import httpx
import base64
import msal
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

def create_tables():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("CREATE SCHEMA IF NOT EXISTS public")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.s3_connections (
            id SERIAL PRIMARY KEY,
            bucket_name VARCHAR(255) NOT NULL,
            region VARCHAR(100) NOT NULL,
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.servicenow_connections (
            id SERIAL PRIMARY KEY,
            instance_url VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.onedrive_connections (
            id SERIAL PRIMARY KEY,
            client_id VARCHAR(255) NOT NULL,
            tenant_id VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("✅ All tables ready!")

create_tables()

token_store = {}

# ─── Models ───────────────────────────────────────────────────────────────────

class S3ConnectRequest(BaseModel):
    bucketName: str
    region: str
    accessKeyId: str
    secretAccessKey: str

class S3ListFilesRequest(BaseModel):
    bucketName: str
    region: str
    accessKeyId: str
    secretAccessKey: str
    search: Optional[str] = None

class SNConnectRequest(BaseModel):
    instanceUrl: str
    username: str
    password: str

class SNFetchArticlesRequest(BaseModel):
    instanceUrl: str
    username: str
    password: str
    search: Optional[str] = None

class ODInitiateRequest(BaseModel):
    client_id: str
    tenant_id: str

class ODPollRequest(BaseModel):
    client_id: str
    tenant_id: str
    device_code: str

class ODFetchFilesRequest(BaseModel):
    client_id: str
    folder_id: str = "root"
    search: str = ""

# ─── S3 Routes ────────────────────────────────────────────────────────────────

@app.post("/api/s3/connect")
def s3_connect(req: S3ConnectRequest):
    try:
        s3 = boto3.client(
            "s3",
            region_name=req.region,
            aws_access_key_id=req.accessKeyId,
            aws_secret_access_key=req.secretAccessKey,
        )
        s3.list_objects_v2(Bucket=req.bucketName, MaxKeys=1)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO public.s3_connections (bucket_name, region) VALUES (%s, %s)",
            [req.bucketName, req.region]
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "Connected to S3!"}
    except ClientError as e:
        print(f"ClientError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Exception: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/s3/list-files")
def s3_list_files(req: S3ListFilesRequest):
    try:
        s3 = boto3.client(
            "s3",
            region_name=req.region,
            aws_access_key_id=req.accessKeyId,
            aws_secret_access_key=req.secretAccessKey,
        )
        response = s3.list_objects_v2(Bucket=req.bucketName)
        files = response.get("Contents", [])
        if req.search:
            files = [f for f in files if req.search.lower() in f["Key"].lower()]
        file_list = [
            {
                "key": f["Key"],
                "size": f["Size"],
                "lastModified": f["LastModified"].isoformat(),
                "type": f["Key"].split(".")[-1].upper() if "." in f["Key"] else "FILE",
            }
            for f in files
        ]
        return {"success": True, "files": file_list}
    except Exception as e:
        print(f"List files error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ─── ServiceNow Routes ────────────────────────────────────────────────────────

def get_auth_header(username: str, password: str) -> str:
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    return f"Basic {token}"

@app.post("/api/servicenow/connect")
async def sn_connect(req: SNConnectRequest):
    auth_header = get_auth_header(req.username, req.password)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{req.instanceUrl}/api/now/table/kb_knowledge",
                headers={"Authorization": auth_header, "Accept": "application/json"},
                params={"sysparm_limit": 1},
            )
            if response.status_code != 200:
                error_msg = response.json().get("error", {}).get("message", "Connection failed!")
                raise HTTPException(status_code=400, detail=error_msg)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO public.servicenow_connections (instance_url, username) VALUES (%s, %s)",
            [req.instanceUrl, req.username]
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "Connected to ServiceNow!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/servicenow/fetch-articles")
async def sn_fetch_articles(req: SNFetchArticlesRequest):
    auth_header = get_auth_header(req.username, req.password)
    try:
        params = {
            "sysparm_limit": 20,
            "sysparm_fields": "sys_id,number,short_description,category,author,sys_created_on,workflow_state",
            "sysparm_display_value": "true",
            "sysparm_query": f"short_descriptionLIKE{req.search}" if req.search else "",
            "sysparm_order_by": "sys_created_on",
            "sysparm_order_by_direction": "desc",
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{req.instanceUrl}/api/now/table/kb_knowledge",
                headers={"Authorization": auth_header, "Accept": "application/json"},
                params=params,
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch articles!")
        return {"success": True, "articles": response.json().get("result", [])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── OneDrive Routes ──────────────────────────────────────────────────────────

SCOPES = ["Files.Read", "User.Read"]

@app.post("/api/onedrive/initiate-login")
def od_initiate_login(req: ODInitiateRequest):
    try:
        authority = f"https://login.microsoftonline.com/{req.tenant_id}"
        msal_app = msal.PublicClientApplication(req.client_id, authority=authority)
        flow = msal_app.initiate_device_flow(scopes=SCOPES)
        if "user_code" not in flow:
            raise HTTPException(status_code=400, detail="Failed to create device flow")
        token_store[req.client_id] = {"flow": flow, "msal_app": msal_app, "tenant_id": req.tenant_id}
        return {
            "success": True,
            "user_code": flow["user_code"],
            "verification_url": flow["verification_uri"],
            "message": flow["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/onedrive/poll-token")
def od_poll_token(req: ODPollRequest):
    try:
        store = token_store.get(req.client_id)
        if not store:
            raise HTTPException(status_code=400, detail="No active login session.")
        msal_app = store["msal_app"]
        flow = store["flow"]
        result = msal_app.acquire_token_by_device_flow(flow)
        if "access_token" not in result:
            error = result.get("error_description", "Login not completed yet")
            raise HTTPException(status_code=400, detail=error)
        token_store[req.client_id]["access_token"] = result["access_token"]
        headers = {"Authorization": f"Bearer {result['access_token']}"}
        with httpx.Client() as client:
            me = client.get("https://graph.microsoft.com/v1.0/me", headers=headers)
            email = me.json().get("mail") or me.json().get("userPrincipalName", "unknown")
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO public.onedrive_connections (client_id, tenant_id, email) VALUES (%s, %s, %s)",
            (req.client_id, store["tenant_id"], email)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "email": email, "message": "Connected successfully!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/onedrive/fetch-files")
def od_fetch_files(req: ODFetchFilesRequest):
    try:
        store = token_store.get(req.client_id)
        if not store or "access_token" not in store:
            raise HTTPException(status_code=401, detail="Not connected. Please login first.")
        token = store["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        with httpx.Client() as client:
            if req.search:
                url = f"https://graph.microsoft.com/v1.0/me/drive/root/search(q='{req.search}')"
            elif req.folder_id and req.folder_id != "root":
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{req.folder_id}/children"
            else:
                url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            response = client.get(url, headers=headers)
            data = response.json()
        files = []
        for item in data.get("value", []):
            files.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "size": item.get("size", 0),
                "type": "folder" if "folder" in item else item.get("file", {}).get("mimeType", "file"),
                "lastModified": item.get("lastModifiedDateTime"),
                "webUrl": item.get("webUrl"),
                "isFolder": "folder" in item
            })
        return {"success": True, "files": files}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)