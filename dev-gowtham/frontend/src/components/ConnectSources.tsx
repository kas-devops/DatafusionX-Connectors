// v2
import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Divider, IconButton,
  Alert, Stack, List, ListItemButton, ListItemText, ListItemIcon,
  InputAdornment,
} from "@mui/material";
import {
  CheckCircle, Cancel, Link as LinkIcon, Settings, Close, Security,
  FolderOpen, Article, ChevronRight, Search, OpenInNew,
} from "@mui/icons-material";

type ConnStatus = "connected" | "not_connected";
interface Connector { id: string; name: string; desc: string; status: ConnStatus; color: string; icon: string; }

const INIT_CONNECTORS: Connector[] = [
  { id: "confluence", name: "Confluence", desc: "Atlassian wiki & docs", status: "not_connected", color: "#0052CC", icon: "C" },
  { id: "sharepoint", name: "SharePoint", desc: "Microsoft SharePoint", status: "not_connected", color: "#038387", icon: "S" },
  { id: "jira", name: "Jira", desc: "Atlassian project tracker", status: "not_connected", color: "#0052CC", icon: "J" },
  { id: "servicenow", name: "ServiceNow", desc: "IT service management", status: "not_connected", color: "#62D84E", icon: "SN" },
  { id: "gdrive", name: "Google Drive", desc: "Google Workspace storage", status: "not_connected", color: "#FBBC05", icon: "G" },
  { id: "onedrive", name: "OneDrive", desc: "Microsoft OneDrive", status: "not_connected", color: "#0078D4", icon: "OD" },
  { id: "s3", name: "AWS S3", desc: "Amazon S3 storage", status: "not_connected", color: "#FF9900", icon: "AWS" },
  { id: "databricks", name: "Databricks", desc: "Databricks workspace", status: "not_connected", color: "#FF3621", icon: "DB" },
];

const IconBox: React.FC<{ conn: Connector; size?: number }> = ({ conn, size = 36 }) => (
  <Box sx={{ width: size, height: size, borderRadius: 1.5, bgcolor: conn.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: conn.icon.length > 2 ? 9 : conn.icon.length > 1 ? 11 : 14 }}>{conn.icon}</Typography>
  </Box>
);

// ── S3 Browser ───────────────────────────────────────────────────────────────
interface S3File { key: string; size: number; lastModified: string; type: string; }

const S3Browser: React.FC<{ bucketName: string; region: string; accessKeyId: string; secretAccessKey: string; onSelect: (f: S3File) => void }> = ({ bucketName, region, accessKeyId, secretAccessKey, onSelect }) => {
  const [files, setFiles] = React.useState<S3File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const fetchFiles = async (q = "") => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/s3/list-files", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, region, accessKeyId, secretAccessKey, search: q }),
      });
      const data = await res.json();
      if (data.success) setFiles(data.files ?? []);
      else setError("Failed to load files");
    } catch { setError("Cannot reach backend on port 5000."); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchFiles(); }, []);

  const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

  return (
    <Box>
      <TextField size="small" fullWidth placeholder="Search files..." value={search}
        onChange={(e) => { setSearch(e.target.value); fetchFiles(e.target.value); }} sx={{ mb: 1.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> } }} />
      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>Loading files...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}
      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {files.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography sx={{ fontSize: 12, color: "text.secondary" }}>No files found</Typography></Box>
            : files.map((f, i) => (
              <ListItemButton key={i} onClick={() => onSelect(f)} divider={i < files.length - 1} sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#fff7ed" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}><FolderOpen sx={{ fontSize: 16, color: "#FF9900" }} /></ListItemIcon>
                <ListItemText primary={f.key} secondary={`${f.type} · ${fmt(f.size)}`}
                  slotProps={{ primary: { style: { fontSize: 12.5, fontWeight: 500, color: "#1e293b" } }, secondary: { style: { fontSize: 11, color: "#94a3b8" } } }} />
                <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
              </ListItemButton>
            ))}
        </List>
      )}
    </Box>
  );
};

// ── ServiceNow Browser ───────────────────────────────────────────────────────
interface SNArticle { sys_id: string; number: string; short_description: string; category: string; workflow_state: string; sys_created_on: string; }

const SNBrowser: React.FC<{ instanceUrl: string; username: string; password: string; onSelect: (a: SNArticle) => void }> = ({ instanceUrl, username, password, onSelect }) => {
  const [articles, setArticles] = React.useState<SNArticle[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const fetchArticles = async (q = "") => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/servicenow/fetch-articles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceUrl, username, password, search: q }),
      });
      const data = await res.json();
      if (data.success) setArticles(data.articles ?? []);
      else setError("Failed to load articles");
    } catch { setError("Cannot reach backend on port 5000."); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchArticles(); }, []);

  return (
    <Box>
      <TextField size="small" fullWidth placeholder="Search articles..." value={search}
        onChange={(e) => { setSearch(e.target.value); fetchArticles(e.target.value); }} sx={{ mb: 1.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> } }} />
      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>Loading articles...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}
      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {articles.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography sx={{ fontSize: 12, color: "text.secondary" }}>No articles found</Typography></Box>
            : articles.map((a, i) => (
              <ListItemButton key={i} onClick={() => onSelect(a)} divider={i < articles.length - 1} sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#f0fdf4" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}><Article sx={{ fontSize: 16, color: "#62D84E" }} /></ListItemIcon>
                <ListItemText primary={a.short_description} secondary={`${a.number} · ${a.category || "General"}`}
                  slotProps={{ primary: { style: { fontSize: 12.5, fontWeight: 500, color: "#1e293b" } }, secondary: { style: { fontSize: 11, color: "#94a3b8" } } }} />
                <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
              </ListItemButton>
            ))}
        </List>
      )}
    </Box>
  );
};
interface ODFile { id: string; name: string; size: number; type: string; isFolder: boolean; webUrl: string; }

// ── OneDrive Browser ─────────────────────────────────────────────────────────
const ODBrowser: React.FC<{ clientId: string; onSelect: (f: ODFile) => void }> = ({ clientId, onSelect }) => {
  const [files, setFiles] = React.useState<ODFile[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [currentFolder, setCurrentFolder] = React.useState("root");
  const [breadcrumb, setBreadcrumb] = React.useState<{ id: string; name: string }[]>([{ id: "root", name: "My Drive" }]);

  const fetchFiles = async (folderId = "root", q = "") => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/onedrive/fetch-files", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, folder_id: folderId, search: q }),
      });
      const data = await res.json();
      if (data.success) setFiles(data.files ?? []);
      else setError("Failed to load files");
    } catch { setError("Cannot reach backend on port 5000."); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchFiles(currentFolder); }, [currentFolder]);

  const handleClick = (f: ODFile) => {
    if (f.isFolder) {
      setCurrentFolder(f.id);
      setBreadcrumb(prev => [...prev, { id: f.id, name: f.name }]);
    } else {
      onSelect(f);
    }
  };

  const handleBreadcrumb = (id: string, index: number) => {
    setCurrentFolder(id);
    setBreadcrumb(prev => prev.slice(0, index + 1));
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
        {breadcrumb.map((b, i) => (
          <Box key={b.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              onClick={() => handleBreadcrumb(b.id, i)}
              sx={{ fontSize: 11, color: i === breadcrumb.length - 1 ? "#0f172a" : "#1565c0", cursor: "pointer", fontWeight: i === breadcrumb.length - 1 ? 700 : 400 }}>
              {b.name}
            </Typography>
            {i < breadcrumb.length - 1 && <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>/</Typography>}
          </Box>
        ))}
      </Box>
      <TextField size="small" fullWidth placeholder="Search files..." value={search}
        onChange={(e) => { setSearch(e.target.value); fetchFiles(currentFolder, e.target.value); }} sx={{ mb: 1.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> } }} />
      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>Loading...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}
      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {files.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography sx={{ fontSize: 12, color: "text.secondary" }}>No files found</Typography></Box>
            : files.map((f, i) => (
              <ListItemButton key={i} onClick={() => handleClick(f)} divider={i < files.length - 1} sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#eff6ff" } }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <FolderOpen sx={{ fontSize: 16, color: f.isFolder ? "#FBBC05" : "#0078D4" }} />
                </ListItemIcon>
                <ListItemText primary={f.name} secondary={f.isFolder ? "Folder — click to open" : f.type}
                  slotProps={{ primary: { style: { fontSize: 12.5, fontWeight: 500, color: "#1e293b" } }, secondary: { style: { fontSize: 11, color: "#94a3b8" } } }} />
                <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
              </ListItemButton>
            ))}
        </List>
      )}
    </Box>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export interface SelectedItem {
  name: string; type: string; source: string;
  extra?: { number?: string; category?: string; webUrl?: string };
}

interface Props {
  onItemSelected?: (item: SelectedItem) => void;
}

const ConnectSources: React.FC<Props> = ({ onItemSelected }) => {
  const [connectors, setConnectors] = useState<Connector[]>(INIT_CONNECTORS);
  const [selected, setSelected] = useState<Connector | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"form" | "browser">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // S3 fields
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [selS3File, setSelS3File] = useState<S3File | null>(null);

  // ServiceNow fields
  const [snInstanceUrl, setSnInstanceUrl] = useState("");
  const [snUsername, setSnUsername] = useState("");
  const [snPassword, setSnPassword] = useState("");
  const [selArticle, setSelArticle] = useState<SNArticle | null>(null);

  // OneDrive fields
  const [odClientId, setOdClientId] = useState("");
  const [odTenantId, setOdTenantId] = useState("");
  const [odUserCode, setOdUserCode] = useState("");
  const [odVerifyUrl, setOdVerifyUrl] = useState("");
  const [odStep, setOdStep] = useState<"creds" | "device" | "browser">("creds");
  const [odEmail, setOdEmail] = useState("");
  const [selOdFile, setSelOdFile] = useState<ODFile | null>(null);

  const handleOpen = (conn: Connector) => {
    setSelected(conn); setDialogOpen(true); setStep("form"); setError(null);
    setSelS3File(null); setSelArticle(null); setSelOdFile(null);
    setOdStep("creds"); setOdUserCode(""); setOdVerifyUrl("");
  };
  const handleClose = () => { setDialogOpen(false); setSelected(null); setError(null); };

  const handleConnect = async () => {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      if (selected.id === "s3") {
        const res = await fetch("http://localhost:5000/api/s3/connect", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucketName, region, accessKeyId, secretAccessKey }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.detail || data.message);
        setConnectors(prev => prev.map(c => c.id === "s3" ? { ...c, status: "connected" } : c));
        setStep("browser");

      } else if (selected.id === "servicenow") {
        const res = await fetch("http://localhost:5000/api/servicenow/connect", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceUrl: snInstanceUrl, username: snUsername, password: snPassword }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.detail || data.message);
        setConnectors(prev => prev.map(c => c.id === "servicenow" ? { ...c, status: "connected" } : c));
        setStep("browser");

      } else if (selected.id === "onedrive") {
        if (odStep === "creds") {
          const res = await fetch("http://localhost:5000/api/onedrive/initiate-login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: odClientId, tenant_id: odTenantId }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.detail || data.message);
          setOdUserCode(data.user_code);
          setOdVerifyUrl(data.verification_url);
          setOdStep("device");

        } else if (odStep === "device") {
          const res = await fetch("http://localhost:5000/api/onedrive/poll-token", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: odClientId, tenant_id: odTenantId, device_code: "" }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.detail || data.message);
          setOdEmail(data.email);
          setConnectors(prev => prev.map(c => c.id === "onedrive" ? { ...c, status: "connected" } : c));
          setOdStep("browser");
          setStep("browser");
        }

      } else {
        await new Promise(r => setTimeout(r, 800));
        setConnectors(prev => prev.map(c => c.id === selected.id ? { ...c, status: "connected" } : c));
        handleClose();
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Connection failed"); }
    finally { setLoading(false); }
  };

  const handleUseItem = () => {
    if (!selected || !onItemSelected) return;
    if (selected.id === "s3" && selS3File) {
      onItemSelected({ name: selS3File.key, type: selS3File.type, source: "S3" });
    } else if (selected.id === "servicenow" && selArticle) {
      onItemSelected({ name: selArticle.short_description, type: "Article", source: "SERVICENOW", extra: { number: selArticle.number, category: selArticle.category } });
    } else if (selected.id === "onedrive" && selOdFile) {
      onItemSelected({ name: selOdFile.name, type: selOdFile.type, source: "ONEDRIVE", extra: { webUrl: selOdFile.webUrl } });
    }
    handleClose();
  };

  const canUse = selected?.id === "s3" ? !!selS3File : selected?.id === "servicenow" ? !!selArticle : selected?.id === "onedrive" ? !!selOdFile : false;
  const connectedCount = connectors.filter(c => c.status === "connected").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ fontSize: 17, color: "#1565c0" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Connect Sources</Typography>
        </Box>
        <Chip label={`${connectedCount} / ${connectors.length} connected`} size="small"
          sx={{ bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: 700, fontSize: 11, height: 22 }} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 0.8, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6 }}>ENTERPRISE CONNECTORS</Typography>
        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6 }}>STATUS</Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {connectors.map((conn) => {
          const isConn = conn.status === "connected";
          return (
            <Box key={conn.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.2, px: 2, borderBottom: "1px solid #f1f5f9", "&:hover": { bgcolor: "#fafafa" } }}>
              <IconBox conn={conn} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }} noWrap>{conn.name}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                  {isConn
                    ? <><CheckCircle sx={{ fontSize: 11, color: "#2e7d32" }} /><Typography sx={{ fontSize: 10.5, color: "#2e7d32", fontWeight: 600 }}>Connected</Typography></>
                    : <><Cancel sx={{ fontSize: 11, color: "#9e9e9e" }} /><Typography sx={{ fontSize: 10.5, color: "#9e9e9e" }}>Not connected</Typography></>}
                </Box>
              </Box>
              {isConn
                ? <Button size="small" startIcon={<Settings sx={{ fontSize: 13 }} />} onClick={() => handleOpen(conn)} sx={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Manage</Button>
                : <Button size="small" startIcon={<LinkIcon sx={{ fontSize: 13 }} />} onClick={() => handleOpen(conn)} sx={{ fontSize: 11.5, fontWeight: 700, color: "#1565c0" }}>Connect</Button>}
            </Box>
          );
        })}
      </Box>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1.5 }}>
          {selected && <IconBox conn={selected} size={32} />}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {step === "form" ? `Connect to ${selected?.name}` : `Select from ${selected?.name}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">{selected?.desc}</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {step === "form" && (
            <Stack spacing={2}>
              {selected?.id === "s3" && (
                <>
                  <TextField label="Bucket Name" size="small" fullWidth value={bucketName} onChange={e => setBucketName(e.target.value)} />
                  <TextField label="AWS Region" size="small" fullWidth value={region} onChange={e => setRegion(e.target.value)} placeholder="ap-south-1" />
                  <TextField label="Access Key ID" size="small" fullWidth value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} />
                  <TextField label="Secret Access Key" size="small" fullWidth value={secretAccessKey} onChange={e => setSecretAccessKey(e.target.value)} type="password" />
                </>
              )}
              {selected?.id === "servicenow" && (
                <>
                  <TextField label="Instance URL" size="small" fullWidth value={snInstanceUrl} onChange={e => setSnInstanceUrl(e.target.value)} placeholder="https://your-instance.service-now.com" />
                  <TextField label="Username" size="small" fullWidth value={snUsername} onChange={e => setSnUsername(e.target.value)} />
                  <TextField label="Password" size="small" fullWidth value={snPassword} onChange={e => setSnPassword(e.target.value)} type="password" />
                </>
              )}
              {selected?.id === "onedrive" && odStep === "creds" && (
                <>
                  <TextField label="Client ID" size="small" fullWidth value={odClientId} onChange={e => setOdClientId(e.target.value)} />
                  <TextField label="Tenant ID" size="small" fullWidth value={odTenantId} onChange={e => setOdTenantId(e.target.value)} />
                </>
              )}
              {selected?.id === "onedrive" && odStep === "device" && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                    Go to <strong>{odVerifyUrl}</strong> and enter code: <strong>{odUserCode}</strong>
                  </Alert>
                  <Button variant="outlined" size="small" startIcon={<OpenInNew />} onClick={() => window.open(odVerifyUrl, "_blank")} sx={{ mb: 1 }}>
                    Open Microsoft Login
                  </Button>
                  <Typography sx={{ fontSize: 11, color: "#64748b" }}>After signing in, click "I've signed in" below.</Typography>
                </Box>
              )}
              {!["s3", "servicenow", "onedrive"].includes(selected?.id ?? "") && (
                <Alert severity="info" sx={{ fontSize: 12 }}>Click Connect to link your {selected?.name} account.</Alert>
              )}
              {error && <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 1.5, p: 1.5 }}>
                <Security sx={{ fontSize: 16, color: "#0369a1" }} />
                <Typography sx={{ fontSize: 12, color: "#0369a1" }}>Credentials are encrypted and stored securely.</Typography>
              </Box>
            </Stack>
          )}

          {step === "browser" && selected?.id === "s3" && (
            <Box>
              <Alert severity="success" sx={{ fontSize: 12, mb: 2 }}>✅ Connected to S3! Select a file to import.</Alert>
              <S3Browser bucketName={bucketName} region={region} accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} onSelect={f => setSelS3File(f)} />
              {selS3File && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <FolderOpen sx={{ fontSize: 16, color: "#FF9900" }} />
                  <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{selS3File.key}</Typography></Box>
                  <CheckCircle sx={{ fontSize: 18, color: "#2e7d32" }} />
                </Box>
              )}
            </Box>
          )}

          {step === "browser" && selected?.id === "servicenow" && (
            <Box>
              <Alert severity="success" sx={{ fontSize: 12, mb: 2 }}>✅ Connected to ServiceNow! Select an article.</Alert>
              <SNBrowser instanceUrl={snInstanceUrl} username={snUsername} password={snPassword} onSelect={a => setSelArticle(a)} />
              {selArticle && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Article sx={{ fontSize: 16, color: "#62D84E" }} />
                  <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{selArticle.short_description}</Typography></Box>
                  <CheckCircle sx={{ fontSize: 18, color: "#2e7d32" }} />
                </Box>
              )}
            </Box>
          )}

          {step === "browser" && selected?.id === "onedrive" && (
            <Box>
              <Alert severity="success" sx={{ fontSize: 12, mb: 2 }}>✅ Connected as {odEmail}! Select a file.</Alert>
              <ODBrowser clientId={odClientId} onSelect={f => setSelOdFile(f)} />
              {selOdFile && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <FolderOpen sx={{ fontSize: 16, color: "#0078D4" }} />
                  <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{selOdFile.name}</Typography></Box>
                  <CheckCircle sx={{ fontSize: 18, color: "#2e7d32" }} />
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
              size="small" sx={{ minWidth: 150, fontWeight: 700, boxShadow: "none", bgcolor: "#1565c0" }}>
              {loading ? "Connecting..." : selected?.id === "onedrive" && odStep === "device" ? "I've signed in" : "Connect"}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleUseItem} disabled={!canUse}
              startIcon={<FolderOpen />} size="small"
              sx={{ minWidth: 150, fontWeight: 700, boxShadow: "none", bgcolor: "#1565c0" }}>
              Use This Item
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectSources;