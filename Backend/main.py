"""
DataFusionX - Backend
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx
import io
import json

from database import engine, get_db
from models import Base, ConfluenceCredential, DatabricksCredential, GoogleDriveCredential

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataFusionX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════

class ConfluenceConnect(BaseModel):
    domain: str
    email: str
    api_token: str

class DatabricksConnect(BaseModel):
    workspace_url: str
    access_token: str

class GoogleDriveConnect(BaseModel):
    sa_json: str
# ═══════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════

def get_confluence_creds(db: Session):
    creds = db.query(ConfluenceCredential).first()
    if not creds:
        raise HTTPException(status_code=401, detail="Confluence not connected.")
    return creds

def get_databricks_creds(db: Session):
    creds = db.query(DatabricksCredential).first()
    if not creds:
        raise HTTPException(status_code=401, detail="Databricks not connected.")
    return creds

async def cf_get(path: str, db: Session, params: dict = {}):
    creds = get_confluence_creds(db)
    url = f"{creds.domain}/wiki/rest/api{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, auth=(creds.email, creds.api_token),
                             params=params, headers={"Accept": "application/json"})
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text[:300])
    return r.json()

async def db_get(path: str, db: Session, params: dict = {}):
    creds = get_databricks_creds(db)
    base = creds.workspace_url.rstrip("/")
    url = f"{base}{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers={
            "Authorization": f"Bearer {creds.access_token}",
            "Content-Type": "application/json"
        }, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text[:300])
    return r.json()


# ═══════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════

@app.get("/")
def health(db: Session = Depends(get_db)):
    cf  = db.query(ConfluenceCredential).first()
    dbx = db.query(DatabricksCredential).first()
    gd  = db.query(GoogleDriveCredential).first()
    return {"status": "ok", "confluence": bool(cf), "databricks": bool(dbx), "googledrive": bool(gd)}


# ═══════════════════════════════════════════════════════
# CONFLUENCE — STATUS
# ═══════════════════════════════════════════════════════

@app.get("/api/confluence/status")
def confluence_status(db: Session = Depends(get_db)):
    creds = db.query(ConfluenceCredential).first()
    if not creds:
        return {"connected": False}
    return {
        "connected": True,
        "user": {
            "displayName": creds.display_name or creds.email,
            "email": creds.email,
        }
    }


# ═══════════════════════════════════════════════════════
# CONFLUENCE — CONNECT
# ═══════════════════════════════════════════════════════

@app.post("/api/connect/confluence")
async def connect_confluence(body: ConfluenceConnect, db: Session = Depends(get_db)):
    base = body.domain.rstrip("/")
    url = f"{base}/wiki/rest/api/user/current"

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(url, auth=(body.email, body.api_token),
                                 headers={"Accept": "application/json"})
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail=f"Cannot reach {base}")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request timed out")

    if r.status_code == 200:
        user = r.json()
        display_name = user.get("displayName", body.email)
        db_creds = db.query(ConfluenceCredential).first()
        if db_creds:
            db_creds.domain = base
            db_creds.email = body.email
            db_creds.api_token = body.api_token
            db_creds.display_name = display_name
        else:
            db.add(ConfluenceCredential(domain=base, email=body.email,
                                        api_token=body.api_token, display_name=display_name))
        db.commit()
        return {"success": True, "message": f"Connected as {display_name}",
                "user": {"displayName": user.get("displayName"), "email": user.get("email"),
                         "accountId": user.get("accountId")}}
    elif r.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid email or API token")
    elif r.status_code == 404:
        raise HTTPException(status_code=404, detail="Confluence not found")
    else:
        raise HTTPException(status_code=r.status_code, detail=r.text[:200])


# ═══════════════════════════════════════════════════════
# CONFLUENCE — SPACES, PAGES, CONTENT, SEARCH, DISCONNECT
# ═══════════════════════════════════════════════════════

@app.get("/api/confluence/spaces")
async def get_spaces(limit: int = 25, start: int = 0, db: Session = Depends(get_db)):
    creds = get_confluence_creds(db)
    data = await cf_get("/space", db, {"limit": limit, "start": start, "expand": "description.plain"})
    spaces = [{"key": s["key"], "name": s["name"], "type": s["type"],
               "description": s.get("description", {}).get("plain", {}).get("value", ""),
               "url": f"{creds.domain}/wiki/spaces/{s['key']}"}
              for s in data.get("results", [])]
    return {"spaces": spaces, "total": data.get("totalSize", len(spaces))}


@app.get("/api/confluence/spaces/{space_key}/pages")
async def get_pages(space_key: str, limit: int = 25, start: int = 0, db: Session = Depends(get_db)):
    creds = get_confluence_creds(db)
    data = await cf_get("/content", db, {"spaceKey": space_key, "type": "page",
                                          "limit": limit, "start": start, "expand": "version,ancestors"})
    pages = [{"id": p["id"], "title": p["title"], "status": p["status"],
              "version": p["version"]["number"],
              "url": f"{creds.domain}/wiki{p['_links']['webui']}",
              "lastModified": p["version"]["when"],
              "author": p["version"]["by"].get("displayName", "Unknown")}
             for p in data.get("results", [])]
    return {"pages": pages, "total": data.get("totalSize", len(pages)), "spaceKey": space_key}


@app.get("/api/confluence/pages/{page_id}")
async def get_page_content(page_id: str, db: Session = Depends(get_db)):
    creds = get_confluence_creds(db)
    data = await cf_get(f"/content/{page_id}", db, {"expand": "body.storage,version,space,ancestors"})
    return {"id": data["id"], "title": data["title"], "space": data["space"]["name"],
            "version": data["version"]["number"],
            "author": data["version"]["by"].get("displayName", "Unknown"),
            "lastModified": data["version"]["when"],
            "body": data["body"]["storage"]["value"],
            "url": f"{creds.domain}/wiki{data['_links']['webui']}"}


@app.get("/api/confluence/search")
async def search_confluence(q: str = Query(...), limit: int = 10, db: Session = Depends(get_db)):
    creds = get_confluence_creds(db)
    data = await cf_get("/content/search", db, {"cql": f'text ~ "{q}" AND type="page"',
                                                  "limit": limit, "expand": "space"})
    results = [{"id": r["id"], "title": r["title"], "space": r["space"]["name"],
                "url": f"{creds.domain}/wiki{r['_links']['webui']}"}
               for r in data.get("results", [])]
    return {"results": results, "total": data.get("totalSize", len(results)), "query": q}


@app.post("/api/confluence/disconnect")
async def confluence_disconnect(db: Session = Depends(get_db)):
    db.query(ConfluenceCredential).delete()
    db.commit()
    return {"success": True, "message": "Disconnected from Confluence"}


# ═══════════════════════════════════════════════════════
# DATABRICKS — STATUS
# ═══════════════════════════════════════════════════════

@app.get("/api/databricks/status")
def databricks_status(db: Session = Depends(get_db)):
    creds = db.query(DatabricksCredential).first()
    if not creds:
        return {"connected": False}
    return {
        "connected": True,
        "workspace_url": creds.workspace_url,
    }


# ═══════════════════════════════════════════════════════
# DATABRICKS — CONNECT  ← THIS WAS MISSING
# ═══════════════════════════════════════════════════════

@app.post("/api/connect/databricks")
async def connect_databricks(body: DatabricksConnect, db: Session = Depends(get_db)):
    base = body.workspace_url.rstrip("/")

    # Validate token by calling workspace/list on root
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                f"{base}/api/2.0/workspace/list",
                headers={
                    "Authorization": f"Bearer {body.access_token}",
                    "Content-Type": "application/json",
                },
                params={"path": "/"},
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail=f"Cannot reach {base}")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request timed out")

    if r.status_code == 200:
        # Fetch the logged-in user's email via SCIM
        user_email = None
        display_name = "Databricks User"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                me_r = await client.get(
                    f"{base}/api/2.0/preview/scim/v2/Me",
                    headers={"Authorization": f"Bearer {body.access_token}"},
                )
            if me_r.status_code == 200:
                me = me_r.json()
                user_email = me.get("userName") or (me.get("emails") or [{}])[0].get("value")
                display_name = me.get("displayName") or user_email or "Databricks User"
        except Exception:
            pass

        # Save / update credentials
        db_creds = db.query(DatabricksCredential).first()
        if db_creds:
            db_creds.workspace_url = base
            db_creds.access_token = body.access_token
            db_creds.user_email   = user_email
            db_creds.display_name = display_name
        else:
            db.add(DatabricksCredential(
                workspace_url=base,
                access_token=body.access_token,
                user_email=user_email,
                display_name=display_name,
            ))
        db.commit()
        return {
            "success": True,
            "message": f"Connected as {display_name}",
            "user": {"displayName": display_name, "email": user_email, "workspace": base},
        }
    elif r.status_code == 403:
        raise HTTPException(status_code=403, detail="Invalid access token")
    elif r.status_code == 401:
        raise HTTPException(status_code=401, detail="Unauthorized — check your token")
    else:
        raise HTTPException(status_code=r.status_code, detail=r.text[:200])


@app.post("/api/databricks/disconnect")
async def databricks_disconnect(db: Session = Depends(get_db)):
    db.query(DatabricksCredential).delete()
    db.commit()
    return {"success": True, "message": "Disconnected from Databricks"}


# ═══════════════════════════════════════════════════════
# DATABRICKS — BROWSE  (single generic endpoint)
# GET /api/databricks/browse?path=/some/path
# Returns folders + files at that path, user navigates freely
# ═══════════════════════════════════════════════════════

@app.get("/api/databricks/browse")
async def browse_workspace(
    path: str = Query(default="/", description="Workspace path to list"),
    db: Session = Depends(get_db),
):
    data = await db_get("/api/2.0/workspace/list", db, {"path": path})
    objects = data.get("objects", [])

    items = []
    for o in objects:
        obj_type = o.get("object_type", "")
        p = o["path"]
        lang = o.get("language", "")
        items.append({
            "name":        p.split("/")[-1] or p,
            "path":        p,
            "object_type": obj_type,
            "language":    lang,
        })

    # Sort: folders first, then files
    items.sort(key=lambda x: (0 if x["object_type"] in ("DIRECTORY", "REPO") else 1, x["name"].lower()))

    return {"items": items, "total": len(items), "path": path}


# Keep old endpoints as thin wrappers so nothing else breaks
@app.get("/api/databricks/catalogs")
async def list_catalogs(db: Session = Depends(get_db)):
    data = await db_get("/api/2.0/workspace/list", db, {"path": "/"})
    objects = data.get("objects", [])
    folders = [o for o in objects if o.get("object_type") in ("DIRECTORY", "REPO")]
    return {"catalogs": [{"name": o["path"], "path": o["path"], "label": o["path"].split("/")[-1]} for o in folders]}

@app.get("/api/databricks/catalogs/{catalog_name:path}/schemas")
async def list_schemas(catalog_name: str, db: Session = Depends(get_db)):
    path = catalog_name if catalog_name.startswith("/") else f"/{catalog_name}"
    data = await db_get("/api/2.0/workspace/list", db, {"path": path})
    objects = data.get("objects", [])
    folders = [o for o in objects if o.get("object_type") in ("DIRECTORY", "REPO")]
    schemas = [{"name": o["path"], "path": o["path"], "label": o["path"].split("/")[-1]} for o in folders]
    if not schemas:
        schemas = [{"name": path, "path": path, "label": "Files"}]
    return {"schemas": schemas, "total": len(schemas)}

@app.get("/api/databricks/tables")
async def list_tables(catalog: str = Query(...), schema: str = Query(...), db: Session = Depends(get_db)):
    path = schema if schema.startswith("/") else f"/{schema}"
    data = await db_get("/api/2.0/workspace/list", db, {"path": path})
    objects = data.get("objects", [])
    items = []
    for o in objects:
        obj_type = o.get("object_type", "")
        if obj_type in ("NOTEBOOK", "FILE", "DIRECTORY", "REPO"):
            lang = o.get("language", "")
            items.append({"name": o["path"].split("/")[-1], "path": o["path"],
                          "table_type": f"{obj_type}{' · ' + lang if lang else ''}", "object_id": str(o.get("object_id", ""))})
    return {"tables": items, "total": len(items)}


    # ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — STATUS
# ═══════════════════════════════════════════════════════

@app.get("/api/googledrive/status")
def googledrive_status(db: Session = Depends(get_db)):
    creds = db.query(GoogleDriveCredential).first()
    if not creds:
        return {"connected": False}
    return {"connected": True, "display_name": creds.display_name}


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — CONNECT
# ═══════════════════════════════════════════════════════

@app.post("/api/connect/googledrive")
async def connect_googledrive(body: GoogleDriveConnect, db: Session = Depends(get_db)):
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        sa_info = json.loads(body.sa_json)
        credentials = service_account.Credentials.from_service_account_info(
            sa_info, scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )
        service = build("drive", "v3", credentials=credentials)
        service.files().list(pageSize=1, supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
        display_name = sa_info.get("client_email", "Google Drive")

        existing = db.query(GoogleDriveCredential).first()
        if existing:
            existing.sa_json      = body.sa_json
            existing.display_name = display_name
        else:
            db.add(GoogleDriveCredential(sa_json=body.sa_json, display_name=display_name))
        db.commit()
        return {"success": True, "user": {"displayName": display_name}}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def get_drive_service(db: Session):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    import json

    creds = db.query(GoogleDriveCredential).first()
    if not creds:
        raise HTTPException(status_code=401, detail="Google Drive not connected.")
    
    sa_info = json.loads(creds.sa_json)
    credentials = service_account.Credentials.from_service_account_info(
        sa_info, scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    return build("drive", "v3", credentials=credentials)
# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — BROWSE
# ═══════════════════════════════════════════════════════

@app.get("/api/googledrive/browse")
def browse_googledrive(
    folder_id: str = Query(default="root"),
    db: Session = Depends(get_db)
):
    service = get_drive_service(db)

    if folder_id == "root":
        query = "trashed=false"
    else:
        query = f"'{folder_id}' in parents and trashed=false"

    results = service.files().list(
        q=query,
        fields="files(id, name, mimeType, size, modifiedTime, owners, starred, webViewLink)",
        orderBy="folder,name",
        pageSize=100,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()

    items = []
    for f in results.get("files", []):
        is_folder = f["mimeType"] == "application/vnd.google-apps.folder"
        items.append({
            "id":          f["id"],
            "name":        f["name"],
            "mimeType":    f["mimeType"],
            "is_folder":   is_folder,
            "size":        f.get("size", 0),
            "modified":    f.get("modifiedTime", ""),
            "webViewLink": f.get("webViewLink", ""),
            "starred":     f.get("starred", False),
            "owner":       f.get("owners", [{}])[0].get("displayName", "Unknown"),
        })
    return {"items": items, "total": len(items), "folder_id": folder_id}


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — SHARED DRIVES
# ═══════════════════════════════════════════════════════

@app.get("/api/googledrive/drives")
def list_shared_drives(db: Session = Depends(get_db)):
    service = get_drive_service(db)
    results = service.drives().list(pageSize=20).execute()
    drives = [
        {"id": d["id"], "name": d["name"], "kind": d.get("kind", "")}
        for d in results.get("drives", [])
    ]
    return {"drives": drives, "total": len(drives)}


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — FILE METADATA
# ═══════════════════════════════════════════════════════

@app.get("/api/googledrive/files/{file_id}")
def get_file_metadata(file_id: str, db: Session = Depends(get_db)):
    service = get_drive_service(db)
    try:
        f = service.files().get(
            fileId=file_id,
            fields="id, name, mimeType, size, modifiedTime, createdTime, owners, "
                   "webViewLink, webContentLink, description, starred, parents, "
                   "lastModifyingUser, version",
            supportsAllDrives=True,
        ).execute()
        return {
            "id":             f["id"],
            "name":           f["name"],
            "mimeType":       f["mimeType"],
            "size":           f.get("size", 0),
            "created":        f.get("createdTime", ""),
            "modified":       f.get("modifiedTime", ""),
            "description":    f.get("description", ""),
            "starred":        f.get("starred", False),
            "version":        f.get("version", ""),
            "webViewLink":    f.get("webViewLink", ""),
            "webContentLink": f.get("webContentLink", ""),
            "owner":          f.get("owners", [{}])[0].get("displayName", "Unknown"),
            "lastModifiedBy": f.get("lastModifyingUser", {}).get("displayName", "Unknown"),
            "parents":        f.get("parents", []),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — FILE CONTENT
# ═══════════════════════════════════════════════════════

from fastapi.responses import StreamingResponse
import io

EXPORT_MIME = {
    "application/vnd.google-apps.document":     "text/plain",
    "application/vnd.google-apps.spreadsheet":  "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

@app.get("/api/googledrive/files/{file_id}/content")
def get_file_content(file_id: str, db: Session = Depends(get_db)):
    service = get_drive_service(db)
    try:
        meta = service.files().get(
            fileId=file_id,
            fields="name, mimeType",
            supportsAllDrives=True,
        ).execute()
        mime = meta["mimeType"]

        if mime in EXPORT_MIME:
            export_mime = EXPORT_MIME[mime]
            content = service.files().export(fileId=file_id, mimeType=export_mime).execute()
            return StreamingResponse(
                io.BytesIO(content),
                media_type=export_mime,
                headers={"Content-Disposition": f'attachment; filename="{meta["name"]}"'},
            )

        content = service.files().get_media(fileId=file_id).execute()
        return StreamingResponse(
            io.BytesIO(content),
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{meta["name"]}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — SEARCH
# ═══════════════════════════════════════════════════════

@app.get("/api/googledrive/search")
def search_drive(
    q: str = Query(..., description="Search term"),
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    service = get_drive_service(db)
    try:
        results = service.files().list(
            q=f"name contains '{q}' and trashed=false",
            fields="files(id, name, mimeType, size, modifiedTime, webViewLink, parents)",
            pageSize=limit,
            orderBy="modifiedTime desc",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        ).execute()
        items = []
        for f in results.get("files", []):
            items.append({
                "id":          f["id"],
                "name":        f["name"],
                "mimeType":    f["mimeType"],
                "is_folder":   f["mimeType"] == "application/vnd.google-apps.folder",
                "size":        f.get("size", 0),
                "modified":    f.get("modifiedTime", ""),
                "webViewLink": f.get("webViewLink", ""),
                "parents":     f.get("parents", []),
            })
        return {"results": items, "total": len(items), "query": q}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════
# GOOGLE DRIVE — DISCONNECT
# ═══════════════════════════════════════════════════════

@app.post("/api/googledrive/disconnect")
def googledrive_disconnect(db: Session = Depends(get_db)):
    db.query(GoogleDriveCredential).delete()
    db.commit()
    return {"success": True, "message": "Disconnected from Google Drive"}