import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Divider, IconButton,
  Alert, Stack, List, ListItemButton, ListItemIcon, ListItemText,
  InputAdornment,
} from "@mui/material";
import { CheckCircle, Cancel, Link as LinkIcon, Settings, Close, Security, BugReport, ChevronRight, Search } from "@mui/icons-material";

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority: { name: string };
    assignee: { displayName: string } | null;
    created: string;
    issuetype: { name: string };
    project: { name: string };
  };
}

const priorityColor: Record<string, string> = {
  Highest: "#dc2626", High: "#ea580c", Medium: "#d97706", Low: "#2563eb", Lowest: "#64748b",
};

const statusColor: Record<string, { bg: string; color: string }> = {
  "To Do": { bg: "#f1f5f9", color: "#475569" },
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  "Done": { bg: "#dcfce7", color: "#16a34a" },
};

const IssueBrowser: React.FC<{
  instanceUrl: string; email: string; apiToken: string;
  onSelect: (issue: JiraIssue) => void;
}> = ({ instanceUrl, email, apiToken, onSelect }) => {
  const [issues, setIssues] = React.useState<JiraIssue[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const fetchIssues = async (searchTerm = "") => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:5002/api/fetch-issues", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceUrl, email, apiToken, search: searchTerm }),
      });
      const data = await res.json();
      if (data.success) setIssues(data.issues ?? []);
      else setError("Failed to load issues");
    } catch { setError("Cannot reach backend on port 5002."); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchIssues(); }, []);

  return (
    <Box>
      <TextField size="small" fullWidth placeholder="Search issues..." value={search}
        onChange={(e) => { setSearch(e.target.value); fetchIssues(e.target.value); }}
        sx={{ mb: 1.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment> } }} />
      {loading && <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>Loading issues...</Typography></Box>}
      {error && <Alert severity="error" sx={{ fontSize: 12, mb: 1 }}>{error}</Alert>}
      {!loading && (
        <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
          {issues.length === 0
            ? <Box sx={{ p: 2, textAlign: "center" }}><Typography sx={{ fontSize: 12, color: "text.secondary" }}>No issues found</Typography></Box>
            : issues.map((issue, i) => {
              const st = statusColor[issue.fields.status.name] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <ListItemButton key={issue.id} onClick={() => onSelect(issue)} divider={i < issues.length - 1}
                  sx={{ py: 1, px: 1.5, "&:hover": { bgcolor: "#f0f4ff" } }}>
                  <ListItemIcon sx={{ minWidth: 28 }}><BugReport sx={{ fontSize: 16, color: "#0052CC" }} /></ListItemIcon>
                  <ListItemText
                    primary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#0052CC" }}>{issue.key}</Typography>
                      <Typography noWrap sx={{ fontSize: 12, color: "#1e293b" }}>{issue.fields.summary}</Typography>
                    </Box>}
                    secondary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.3 }}>
                      <Chip label={issue.fields.status.name} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: 9.5, height: 17 }} />
                      <Typography sx={{ fontSize: 10.5, color: priorityColor[issue.fields.priority?.name] ?? "#64748b" }}>{issue.fields.priority?.name}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: "#94a3b8" }}>{issue.fields.project.name}</Typography>
                    </Box>} />
                  <ChevronRight sx={{ fontSize: 16, color: "#94a3b8" }} />
                </ListItemButton>
              );
            })}
        </List>
      )}
    </Box>
  );
};

interface JiraConnectProps {
  onConnected?: () => void;
  onIssueSelected?: (issue: JiraIssue) => void;
}

const JiraConnect: React.FC<JiraConnectProps> = ({ onConnected, onIssueSelected }) => {
  const [connected, setConnected] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"form" | "browser">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selIssue, setSelIssue] = useState<JiraIssue | null>(null);

  const [instanceUrl, setInstanceUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");

  const handleConnect = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:5002/api/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceUrl, email, apiToken }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setConnected(true);
      if (onConnected) onConnected();
      setStep("browser");
    } catch (e: any) { setError(e.message ?? "Connection failed"); }
    finally { setLoading(false); }
  };

  const handleUseIssue = () => {
    if (selIssue && onIssueSelected) { onIssueSelected(selIssue); setDialogOpen(false); }
  };

  const handleOpen = () => { setDialogOpen(true); setStep(connected ? "browser" : "form"); setError(null); setSelIssue(null); };
  const handleClose = () => { setDialogOpen(false); setError(null); setSelIssue(null); };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ fontSize: 17, color: "#0052CC" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Connect Sources</Typography>
        </Box>
        <Chip label={connected ? "1 / 1 connected" : "0 / 1 connected"} size="small"
          sx={{ bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: 700, fontSize: 11, height: 22 }} />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 0.8, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6 }}>CONNECTOR</Typography>
        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6 }}>STATUS</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, px: 2, borderBottom: "1px solid #f1f5f9" }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "#0052CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>JIRA</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Jira</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            {connected
              ? <><CheckCircle sx={{ fontSize: 11, color: "#2e7d32" }} /><Typography sx={{ fontSize: 10.5, color: "#2e7d32", fontWeight: 600 }}>Connected</Typography></>
              : <><Cancel sx={{ fontSize: 11, color: "#9e9e9e" }} /><Typography sx={{ fontSize: 10.5, color: "#9e9e9e" }}>Not connected</Typography></>}
          </Box>
        </Box>
        {connected
          ? <Button size="small" startIcon={<Settings sx={{ fontSize: 13 }} />} onClick={handleOpen} sx={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Manage</Button>
          : <Button size="small" startIcon={<LinkIcon sx={{ fontSize: 13 }} />} onClick={handleOpen} sx={{ fontSize: 11.5, fontWeight: 700, color: "#0052CC" }}>Connect</Button>}
      </Box>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: "#0052CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 10 }}>JIRA</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{step === "form" ? "Connect to Jira" : "Select Issue from Jira"}</Typography>
            <Typography variant="caption" color="text.secondary">{step === "form" ? "Atlassian Jira" : "Choose an issue to import"}</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {step === "form" && (
            <Stack spacing={2}>
              <TextField label="Jira Instance URL" size="small" fullWidth value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)} placeholder="https://yourcompany.atlassian.net" />
              <TextField label="Email" size="small" fullWidth value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              <TextField label="API Token" size="small" fullWidth value={apiToken}
                onChange={(e) => setApiToken(e.target.value)} type="password" placeholder="Your Jira API token" />
              {error && <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 1.5, p: 1.5 }}>
                <Security sx={{ fontSize: 16, color: "#0369a1" }} />
                <Typography sx={{ fontSize: 12, color: "#0369a1" }}>Credentials are encrypted and stored securely.</Typography>
              </Box>
            </Stack>
          )}

          {step === "browser" && (
            <Box>
              <Alert severity="success" sx={{ fontSize: 12, mb: 2 }}>✅ Connected! Select an issue to import.</Alert>
              <IssueBrowser instanceUrl={instanceUrl} email={email} apiToken={apiToken} onSelect={(i) => setSelIssue(i)} />
              {selIssue && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <BugReport sx={{ fontSize: 16, color: "#0052CC", flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{selIssue.key}: {selIssue.fields.summary}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{selIssue.fields.project.name}</Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 18, color: "#2e7d32", flexShrink: 0 }} />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleClose} color="inherit" size="small" sx={{ fontWeight: 600 }}>Cancel</Button>
          {step === "form"
            ? <Button variant="contained" onClick={handleConnect} disabled={loading || !instanceUrl || !email || !apiToken}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}
                size="small" sx={{ minWidth: 130, fontWeight: 700, boxShadow: "none", bgcolor: "#0052CC" }}>
                {loading ? "Connecting..." : "Connect"}
              </Button>
            : <Button variant="contained" onClick={handleUseIssue} disabled={!selIssue}
                startIcon={<BugReport />} size="small"
                sx={{ minWidth: 150, fontWeight: 700, boxShadow: "none", bgcolor: "#0052CC", "&:hover": { bgcolor: "#003a99" } }}>
                Use This Issue
              </Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JiraConnect;