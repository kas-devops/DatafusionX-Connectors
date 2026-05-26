import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Divider, IconButton,
  Alert, Stack, List, ListItemButton, ListItemText, ListItemIcon,
  Breadcrumbs, Link, Checkbox,
} from "@mui/material";
import {
  CheckCircle, Cancel, Link as LinkIcon, Settings, Close, Security,
  OpenInNew, Folder, Article, ArrowBack, ChevronRight,
} from "@mui/icons-material";

type ConnStatus = "connected" | "not_connected";

interface Connector {
  id: string; name: string; desc: string; status: ConnStatus;
  color: string; icon: string;
  authFields: { key: string; label: string; type: string; placeholder: string; helperText?: string }[];
}

const INIT_CONNECTORS: Connector[] = [
  {
    id: "confluence", name: "Confluence", desc: "Atlassian wiki & docs",
    status: "not_connected", color: "#0052CC", icon: "C",
    authFields: [
      { key: "domain", label: "Confluence Domain", type: "url", placeholder: "https://yourorg.atlassian.net", helperText: "Your Atlassian base URL" },
      { key: "email", label: "Email", type: "email", placeholder: "you@company.com", helperText: "Atlassian account email" },
      { key: "api_token", label: "API Token", type: "password", placeholder: "Enter your Atlassian API token", helperText: "Generate at: id.atlassian.com → Security → API tokens" },
    ],
  },
  {
    id: "sharepoint", name: "SharePoint", desc: "Microsoft SharePoint",
    status: "not_connected", color: "#038387", icon: "S",
    authFields: [
      { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Azure Tenant ID" },
      { key: "client_id", label: "Client ID", type: "text", placeholder: "App Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "App Secret" },
    ],
  },
  {
    id: "jira", name: "Jira", desc: "Atlassian project tracker",
    status: "not_connected", color: "#0052CC", icon: "J",
    authFields: [
      { key: "domain", label: "Jira Domain", type: "url", placeholder: "https://yourorg.atlassian.net" },
      { key: "email", label: "Email", type: "email", placeholder: "you@company.com" },
      { key: "api_token", label: "API Token", type: "password", placeholder: "Atlassian API token" },
    ],
  },
  {
    id: "servicenow", name: "ServiceNow", desc: "IT service management",
    status: "not_connected", color: "#62D84E", icon: "SN",
    authFields: [
      { key: "instance", label: "Instance URL", type: "url", placeholder: "https://instance.service-now.com" },
      { key: "username", label: "Username", type: "text", placeholder: "admin" },
      { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  {
    id: "gdrive", name: "Google Drive", desc: "Google Workspace storage",
    status: "not_connected", color: "#FBBC05", icon: "G",
    authFields: [
      { key: "sa_json", label: "Service Account JSON", type: "text", placeholder: "Paste your Service Account JSON here", helperText: "From Google Cloud Console → IAM → Service Accounts → Keys" },
    ],
  },
  {
    id: "onedrive", name: "OneDrive", desc: "Microsoft OneDrive",
    status: "not_connected", color: "#0078D4", icon: "OD",
    authFields: [
      { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Azure Tenant ID" },
      { key: "client_id", label: "Client ID", type: "text", placeholder: "App Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "App Secret" },
    ],
  },
  {
    id: "databricks", name: "Databricks", desc: "Databricks workspace & notebooks",
    status: "not_connected", color: "#FF3621", icon: "DB",
    authFields: [
      { key: "workspace_url", label: "Workspace URL", type: "url", placeholder: "https://dbc-xxxx.cloud.databricks.com", helperText: "Your Databricks workspace URL" },
      { key: "access_token", label: "Personal Access Token", type: "password", placeholder: "dapixxxxxxxx", helperText: "Generate from Databricks: User Settings → Access Tokens" },
    ],
  },
  {
    id: "aws", name: "AWS S3 / AWS", desc: "Amazon Web Services",
    status: "not_connected", color: "#FF9900", icon: "AWS",
    authFields: [
      { key: "access_key", label: "Access Key ID", type: "text", placeholder: "AKIA..." },
      { key: "secret_key", label: "Secret Access Key", type: "password", placeholder: "••••••••" },
      { key: "bucket", label: "S3 Bucket", type: "text", placeholder: "my-bucket" },
      { key: "region", label: "Region", type: "text", placeholder: "us-east-1" },
    ],
  },
];

const IconBox: React.FC<{ conn: Connector; size?: number }> = ({ conn, size = 40 }) => (
  <Box sx={{ width: size, height: size, borderRadius: 1.5, bgcolor: conn.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: conn.icon.length > 2 ? 9 : conn.icon.length > 1 ? 11 : 14, lineHeight: 1 }}>{conn.icon}</Typography>
  </Box>
);

// ─── Confluence File Browser ──────────────────────────────────────────────────
interface Space { key: string; name: string; }
interface Page { id: string; title: string; author: string; lastModified: string; }

const FileBrowser: React.FC<{ onSelect: (pageId: string, pageTitle: string, spaceName: string) => void }> = ({ onSelect }) => {
  const [view, setView] = useState<"spaces" | "pages">("spaces");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selSpace, setSelSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/confluence/spaces")
      .then((r) => r.json())
      .then((d) => { setSpaces(d.spaces ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load spaces"); setLoading(false); });
  }, []);

  const loadPages = (space: Space) => {
    setSelSpace(space); setView("pages"); setLoading(true);
    fetch(`http://localhost:8000/api/confluence/spaces/${space.key}/pages`)
      .then((r) => r.json())
      .then((d) => { setPages(d.pages ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load pages"); setLoading(false); });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {view === "pages" && (
          <IconButton size="small" onClick={() => setView("spaces")} sx={{ p: 0.3 }}>
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        <Breadcrumbs sx={{ fontSize: 12 }}>
          <Link component="button" underline="hover" onClick={() => setView("spaces")}
            sx={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: view === "spaces" ? "#0f172a" : "#64748b" }}>
            Spaces
          </Link>
          {selSpace && <Typography fontSize={12} fontWeight={600} color="#0f172a">{selSpace.name}</Typography>}
        </Breadcrumbs>
      </Box>

      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography fontSize={12} color="text.secondary">Loading...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}

      {!loading && view === "spaces" && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {spaces.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography fontSize={12} color="text.secondary">No spaces found</Typography></Box>
            : spaces.map((s, i) => (
              <ListItemButton key={s.key} onClick={() => loadPages(s)} divider={i < spaces.length - 1} sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#f0f7ff" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}><Folder sx={{ fontSize: 16, color: "#1565c0" }} /></ListItemIcon>
                <ListItemText primary={s.name} secondary={s.key}
                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}
                  secondaryTypographyProps={{ fontSize: 11, color: "#94a3b8" }} />
                <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
              </ListItemButton>
            ))}
        </List>
      )}

      {!loading && view === "pages" && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {pages.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography fontSize={12} color="text.secondary">No pages found</Typography></Box>
            : pages.map((p, i) => (
              <ListItemButton key={p.id} onClick={() => onSelect(p.id, p.title, selSpace!.name)}
                divider={i < pages.length - 1} sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#f0f7ff" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}><Article sx={{ fontSize: 16, color: "#475569" }} /></ListItemIcon>
                <ListItemText primary={p.title}
                  secondary={`${p.author} · ${new Date(p.lastModified).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b" }}
                  secondaryTypographyProps={{ fontSize: 11, color: "#94a3b8" }} />
              </ListItemButton>
            ))}
        </List>
      )}
    </Box>
  );
};

// ─── Databricks Browser (Multi-select) ───────────────────────────────────────
interface DbItem { name: string; path: string; object_type: string; language?: string; }
interface SelectedFile { id: string; title: string; space: string; }

const DatabricksBrowser: React.FC<{ onSelectionChange: (items: SelectedFile[]) => void }> = ({ onSelectionChange }) => {
  const [stack, setStack]     = useState<{ label: string; path: string }[]>([]);
  const [items, setItems]     = useState<DbItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const loadPath = async (path: string, label: string, push = true) => {
    setLoading(true); setError(null); setChecked(new Set()); onSelectionChange([]);
    try {
      const res  = await fetch(`http://localhost:8000/api/databricks/browse?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to load");
      setItems(data.items ?? []);
      if (push) setStack(prev => [...prev, { label, path }]);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadPath("/", "Workspace", true); }, []);

  const goBack = () => {
    if (stack.length <= 1) return;
    const prev = stack[stack.length - 2];
    setStack(s => s.slice(0, -1));
    loadPath(prev.path, prev.label, false);
  };

  const toggleCheck = (item: DbItem) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(item.path) ? next.delete(item.path) : next.add(item.path);
      const sel: SelectedFile[] = items
        .filter(i => i.object_type !== "DIRECTORY" && next.has(i.path))
        .map(i => ({ id: i.path, title: i.name, space: stack.map(s => s.label).join(" / ") }));
      onSelectionChange(sel);
      return next;
    });
  };

  const selectableItems = items.filter(i => i.object_type !== "DIRECTORY");

  const toggleAll = () => {
    if (checked.size === selectableItems.length && selectableItems.length > 0) {
      setChecked(new Set()); onSelectionChange([]);
    } else {
      const all = new Set(selectableItems.map(i => i.path));
      setChecked(all);
      onSelectionChange(selectableItems.map(i => ({ id: i.path, title: i.name, space: stack.map(s => s.label).join(" / ") })));
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {stack.length > 1 && (
          <IconButton size="small" onClick={goBack} sx={{ p: 0.3 }}>
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        <Breadcrumbs sx={{ fontSize: 12 }}>
          {stack.map((s, i) => {
            const isLast = i === stack.length - 1;
            return isLast
              ? <Typography key={s.path} fontSize={12} fontWeight={700} color="#0f172a">{s.label}</Typography>
              : <Link key={s.path} component="button" underline="hover"
                  onClick={() => { setStack(prev => prev.slice(0, i + 1)); loadPath(s.path, s.label, false); }}
                  sx={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>{s.label}</Link>;
          })}
        </Breadcrumbs>
      </Box>

      {loading && <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}><CircularProgress size={14} /><Typography fontSize={12} color="text.secondary">Loading...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}

      {!loading && selectableItems.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5, px: 0.5 }}>
          <Typography fontSize={11} color="#64748b">
            {checked.size > 0 ? `${checked.size} of ${selectableItems.length} selected` : `${items.length} items`}
          </Typography>
          <Button size="small" onClick={toggleAll}
            sx={{ fontSize: 11, fontWeight: 600, color: "#1565c0", minWidth: 0, p: "2px 6px", textTransform: "none" }}>
            {checked.size === selectableItems.length ? "Deselect All" : "Select All"}
          </Button>
        </Box>
      )}

      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
          {items.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography fontSize={12} color="text.secondary">Empty folder</Typography></Box>
            : items.map((item, i) => {
                const isFolder  = item.object_type === "DIRECTORY" || item.object_type === "REPO";
                const isChecked = checked.has(item.path);
                return (
                  <ListItemButton key={item.path} divider={i < items.length - 1}
                    onClick={() => isFolder ? loadPath(item.path, item.name, true) : toggleCheck(item)}
                    sx={{ py: 0.9, px: 1.5, bgcolor: isChecked ? "#f0f7ff" : "transparent", "&:hover": { bgcolor: isChecked ? "#dbeafe" : "#f8fafc" } }}>
                    {!isFolder && (
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox checked={isChecked} size="small"
                          sx={{ p: 0, color: "#94a3b8", "&.Mui-checked": { color: "#1565c0" } }} />
                      </ListItemIcon>
                    )}
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {isFolder
                        ? <Folder sx={{ fontSize: 16, color: "#ef4444" }} />
                        : <Article sx={{ fontSize: 15, color: isChecked ? "#1565c0" : "#475569" }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={item.object_type + (item.language ? ` · ${item.language}` : "")}
                      primaryTypographyProps={{ fontSize: 12.5, fontWeight: isChecked ? 600 : 500, color: isChecked ? "#1565c0" : "#1e293b" }}
                      secondaryTypographyProps={{ fontSize: 11, color: "#94a3b8" }} />
                    {isFolder
                      ? <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
                      : isChecked && <CheckCircle sx={{ fontSize: 15, color: "#1565c0", flexShrink: 0 }} />}
                  </ListItemButton>
                );
              })}
        </List>
      )}
    </Box>
  );
};

// ─── Google Drive Browser ─────────────────────────────────────────────────────
interface DriveItem {
  id: string; name: string; mimeType: string;
  is_folder: boolean; modified: string;
}

const GoogleDriveBrowser: React.FC<{
  onSelect: (id: string, title: string, space: string) => void;
}> = ({ onSelect }) => {
  const [items,       setItems]       = useState<DriveItem[]>([]);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>(
    [{ id: "root", name: "My Drive" }]
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const loadFolder = (folderId: string, folderName: string, push = true) => {
    setLoading(true); setError(null);
    fetch(`http://localhost:8000/api/googledrive/browse?folder_id=${folderId}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? []);
        if (push) setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load files"); setLoading(false); });
  };

  React.useEffect(() => { loadFolder("root", "My Drive", false); }, []);

  const goBack = () => {
    if (folderStack.length <= 1) return;
    const prev = folderStack[folderStack.length - 2];
    setFolderStack(s => s.slice(0, -1));
    loadFolder(prev.id, prev.name, false);
  };

  const currentFolder = folderStack[folderStack.length - 1];

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {folderStack.length > 1 && (
          <IconButton size="small" onClick={goBack} sx={{ p: 0.3 }}>
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        <Breadcrumbs sx={{ fontSize: 12 }}>
          {folderStack.map((f, i) => {
            const isLast = i === folderStack.length - 1;
            return isLast
              ? <Typography key={f.id} fontSize={12} fontWeight={700} color="#0f172a">{f.name}</Typography>
              : <Link key={f.id} component="button" underline="hover"
                  onClick={() => { setFolderStack(s => s.slice(0, i + 1)); loadFolder(f.id, f.name, false); }}
                  sx={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>{f.name}</Link>;
          })}
        </Breadcrumbs>
      </Box>

      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography fontSize={12} color="text.secondary">Loading...</Typography></Box>}
      {error   && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}

      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {items.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography fontSize={12} color="text.secondary">Empty folder</Typography></Box>
            : items.map((item, i) => (
              <ListItemButton key={item.id}
                onClick={() => item.is_folder
                  ? loadFolder(item.id, item.name, true)
                  : onSelect(item.id, item.name, currentFolder.name)}
                divider={i < items.length - 1}
                sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#f0f7ff" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {item.is_folder
                    ? <Folder sx={{ fontSize: 16, color: "#FBBC05" }} />
                    : <Article sx={{ fontSize: 16, color: "#475569" }} />}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={item.modified
                    ? new Date(item.modified).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : ""}
                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b" }}
                  secondaryTypographyProps={{ fontSize: 11, color: "#94a3b8" }} />
                {item.is_folder && <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />}
              </ListItemButton>
            ))}
        </List>
      )}
    </Box>
  );
};

// ─── Connect Dialog ───────────────────────────────────────────────────────────
interface DialogProps {
  conn: Connector | null; open: boolean; onClose: () => void;
  onSuccess: (id: string, displayName: string) => void;
  onPageSelected: (pageId: string, pageTitle: string, spaceName: string) => void;
}

const ConnectDialog: React.FC<DialogProps> = ({ conn, open, onClose, onSuccess, onPageSelected }) => {
  const [vals, setVals]       = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [step, setStep]       = useState<"form" | "browser">("form");
  const [selPage, setSelPage] = useState<{ id: string; title: string; space: string } | null>(null);
  const [selFiles, setSelFiles] = useState<SelectedFile[]>([]);

  if (!conn) return null;

  const set = (k: string, v: string) => { setVals((p) => ({ ...p, [k]: v })); setError(null); };

  const handleClose = () => {
    setVals({}); setError(null); setStep("form");
    setSelPage(null); setSelFiles([]);
    onClose();
  };

  const handleConnect = async () => {
    if (!conn.authFields.every((f) => vals[f.key]?.trim())) { setError("Please fill in all fields."); return; }
    setLoading(true); setError(null);
    try {
      if (conn.id === "confluence") {
        const res = await fetch("http://localhost:8000/api/connect/confluence", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: vals["domain"], email: vals["email"], api_token: vals["api_token"] }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail ?? data.message ?? "Connection failed");
        onSuccess(conn.id, data.user?.displayName || vals["email"]);
        setStep("browser");

      } else if (conn.id === "databricks") {
        const res = await fetch("http://localhost:8000/api/connect/databricks", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace_url: vals["workspace_url"], access_token: vals["access_token"] }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail ?? data.message ?? "Connection failed");
        onSuccess(conn.id, data.user?.displayName || "Databricks User");
        setStep("browser");

      } else if (conn.id === "gdrive") {
        const res = await fetch("http://localhost:8000/api/connect/googledrive", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sa_json: vals["sa_json"] }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail ?? "Connection failed");
        onSuccess(conn.id, data.user?.displayName || "Google Drive");
        setStep("browser");

      } else {
        await new Promise((r) => setTimeout(r, 1200));
        onSuccess(conn.id, "");
        handleClose();
      }
    } catch (e: any) {
      setError(e.message ?? "Unable to connect");
    } finally {
      setLoading(false);
    }
  };

  const handleUseConfluence = () => {
    if (selPage) { onPageSelected(selPage.id, selPage.title, selPage.space); handleClose(); }
  };

  const handleUseDatabricks = () => {
    selFiles.forEach(f => onPageSelected(f.id, f.title, f.space));
    handleClose();
  };

  const handleUseGDrive = () => {
    if (selPage) { onPageSelected(selPage.id, selPage.title, selPage.space); handleClose(); }
  };

  const isDatabricks = conn.id === "databricks";
  const isGDrive     = conn.id === "gdrive";
  const canUse       = isDatabricks ? selFiles.length > 0 : !!selPage;

  const handleUse = () => {
    if (isDatabricks) handleUseDatabricks();
    else if (isGDrive) handleUseGDrive();
    else handleUseConfluence();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1.5 }}>
        <IconBox conn={conn} size={36} />
        <Box flex={1}>
          <Typography fontWeight={700} fontSize={15}>
            {step === "form"
              ? (conn.status === "connected" ? `Manage ${conn.name}` : `Connect to ${conn.name}`)
              : `Select from ${conn.name}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {step === "form" ? conn.desc : isDatabricks ? "Select one or more notebooks/files" : "Choose a file to use"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Step 1 — Credentials */}
        {step === "form" && (
          <Stack spacing={1.5}>
            {conn.id === "confluence" && (
              <Alert severity="info" icon={<OpenInNew fontSize="small" />} sx={{ fontSize: 12, alignItems: "center" }}
                action={<Button size="small" href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" sx={{ fontSize: 11, fontWeight: 700 }}>Get Token ↗</Button>}>
                Generate your API token from Atlassian account settings.
              </Alert>
            )}
            {conn.id === "databricks" && (
              <Alert severity="info" icon={<OpenInNew fontSize="small" />} sx={{ fontSize: 12, alignItems: "center" }}
                action={<Button size="small" href="https://docs.databricks.com/dev-tools/auth/pat.html" target="_blank" sx={{ fontSize: 11, fontWeight: 700 }}>Docs ↗</Button>}>
                Go to Databricks → User Settings → Developer → Access Tokens.
              </Alert>
            )}
            {conn.id === "gdrive" && (
              <Alert severity="info" icon={<OpenInNew fontSize="small" />} sx={{ fontSize: 12, alignItems: "center" }}
                action={<Button size="small" href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" sx={{ fontSize: 11, fontWeight: 700 }}>Console ↗</Button>}>
                Google Cloud Console → Service Accounts → Keys → Create JSON key.
              </Alert>
            )}
            {conn.authFields.map((f) => (
              <TextField key={f.key} label={f.label} type={f.type} placeholder={f.placeholder}
                helperText={f.helperText} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                fullWidth size="small"
                multiline={f.key === "sa_json"} rows={f.key === "sa_json" ? 4 : 1}
                FormHelperTextProps={{ sx: { fontSize: 11 } }} />
            ))}
            {error && <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 1.5, p: 1.5 }}>
              <Security sx={{ fontSize: 16, color: "#0369a1" }} />
              <Typography fontSize={12} color="#0369a1">Credentials are encrypted and stored securely. Never shared.</Typography>
            </Box>
          </Stack>
        )}

        {/* Step 2 — Browser */}
        {step === "browser" && (
          <Box>
            <Alert severity="success" sx={{ fontSize: 12, mb: 2 }}>
              Connected! {isDatabricks ? "Browse your workspace and select files." : "Browse and select a file."}
            </Alert>

            {conn.id === "confluence" && (
              <FileBrowser onSelect={(id, title, space) => setSelPage({ id, title, space })} />
            )}
            {conn.id === "databricks" && (
              <DatabricksBrowser onSelectionChange={setSelFiles} />
            )}
            {conn.id === "gdrive" && (
              <GoogleDriveBrowser onSelect={(id, title, space) => setSelPage({ id, title, space })} />
            )}

            {/* Selected file preview */}
            {!isDatabricks && selPage && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <Article sx={{ fontSize: 16, color: "#1565c0", flexShrink: 0 }} />
                <Box flex={1}>
                  <Typography fontSize={12} fontWeight={600} color="#1e293b">{selPage.title}</Typography>
                  <Typography fontSize={11} color="#64748b">{selPage.space}</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 18, color: "#2e7d32", flexShrink: 0 }} />
              </Box>
            )}

            {/* Databricks selected preview */}
            {isDatabricks && selFiles.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 1.5 }}>
                <Typography fontSize={12} fontWeight={700} color="#1e293b" mb={0.8}>
                  {selFiles.length} file{selFiles.length > 1 ? "s" : ""} selected
                </Typography>
                {selFiles.map(f => (
                  <Box key={f.id} sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 13, color: "#2e7d32", flexShrink: 0 }} />
                    <Typography fontSize={12} color="#1e293b" fontWeight={500}>{f.title}</Typography>
                    <Typography fontSize={11} color="#94a3b8">· {f.space}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} color="inherit" size="small" sx={{ fontWeight: 600 }}>Cancel</Button>

        {step === "form" ? (
          <Button variant="contained" onClick={handleConnect} disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}
            size="small" sx={{ minWidth: 130, fontWeight: 700, boxShadow: "none", bgcolor: "#1565c0", "&:hover": { bgcolor: "#0d47a1", boxShadow: "none" } }}>
            {loading ? "Connecting..." : conn.status === "connected" ? "Update Connection" : "Connect"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleUse} disabled={!canUse}
            startIcon={<Article />} size="small"
            sx={{ minWidth: 150, fontWeight: 700, boxShadow: "none", bgcolor: "#1565c0", "&:hover": { bgcolor: "#0d47a1", boxShadow: "none" } }}>
            {isDatabricks
              ? (selFiles.length > 1 ? `Use ${selFiles.length} Files` : "Use This File")
              : "Use This File"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ─── Connector Row ────────────────────────────────────────────────────────────
const ConnectorRow: React.FC<{ conn: Connector; onOpen: (c: Connector) => void }> = ({ conn, onOpen }) => {
  const isConn = conn.status === "connected";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, px: 2, borderBottom: "1px solid #f1f5f9", "&:last-child": { borderBottom: "none" }, "&:hover": { bgcolor: "#fafafa" }, transition: "background .12s" }}>
      <IconBox conn={conn} />
      <Box flex={1} minWidth={0}>
        <Typography fontWeight={600} fontSize={13.5} color="#1e293b" noWrap>{conn.name}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
          {isConn
            ? <><CheckCircle sx={{ fontSize: 12, color: "#2e7d32" }} /><Typography fontSize={11} color="#2e7d32" fontWeight={600}>Connected</Typography></>
            : <><Cancel sx={{ fontSize: 12, color: "#9e9e9e" }} /><Typography fontSize={11} color="#9e9e9e" fontWeight={500}>Not connected</Typography></>}
        </Box>
      </Box>
      {isConn
        ? <Button size="small" startIcon={<Settings sx={{ fontSize: 14 }} />} onClick={() => onOpen(conn)} sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748b" }}>Manage</Button>
        : <Button size="small" startIcon={<LinkIcon sx={{ fontSize: 14 }} />} onClick={() => onOpen(conn)} sx={{ fontSize: 12.5, fontWeight: 700, color: "#1565c0" }}>Connect</Button>}
    </Box>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
interface ConnectSourcesProps {
  onConfluenceConnected?: (displayName: string) => void;
  onPageSelected?: (pageId: string, pageTitle: string, spaceName: string) => void;
}

const ConnectSources: React.FC<ConnectSourcesProps> = ({ onConfluenceConnected, onPageSelected }) => {
  const [connectors, setConnectors] = useState<Connector[]>(INIT_CONNECTORS);
  const [selected, setSelected]     = useState<Connector | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = (id: string, displayName: string) => {
    setConnectors((prev) => prev.map((c) => c.id === id ? { ...c, status: "connected" } : c));
    if (id === "confluence" && onConfluenceConnected) onConfluenceConnected(displayName);
  };

  const handlePageSelected = (pageId: string, pageTitle: string, spaceName: string) => {
    if (onPageSelected) onPageSelected(pageId, pageTitle, spaceName);
  };

  const connectedCount = connectors.filter((c) => c.status === "connected").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ fontSize: 17, color: "#1565c0" }} />
          <Typography fontWeight={700} fontSize={14} color="#0f172a">Connect Sources</Typography>
        </Box>
        <Chip label={`${connectedCount} / ${connectors.length} connected`} size="small"
          sx={{ bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: 700, fontSize: 11, height: 22 }} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 0.8, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Typography fontSize={10} color="#94a3b8" fontWeight={700} letterSpacing={0.6}>ENTERPRISE CONNECTORS</Typography>
        <Typography fontSize={10} color="#94a3b8" fontWeight={700} letterSpacing={0.6}>CONNECTION STATUS</Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {connectors.map((c) => <ConnectorRow key={c.id} conn={c} onOpen={(c) => { setSelected(c); setDialogOpen(true); }} />)}
      </Box>
      <ConnectDialog conn={selected} open={dialogOpen} onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess} onPageSelected={handlePageSelected} />
    </Box>
  );
};

export default ConnectSources;