import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Divider, IconButton,
  Alert, Stack, Paper, Tooltip,
} from "@mui/material";
import {
  CheckCircle, Cancel, Link as LinkIcon, Settings, Close, Security,
  OpenInNew, WifiOff,
} from "@mui/icons-material";

type ConnStatus = "connected" | "not_connected";

interface Connector {
  id: string;
  name: string;
  desc: string;
  status: ConnStatus;
  color: string;
  icon: string;
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
    status: "connected", color: "#038387", icon: "S",
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
    status: "connected", color: "#FBBC05", icon: "G",
    authFields: [{ key: "sa_json", label: "Service Account JSON", type: "text", placeholder: "Paste JSON key here" }],
  },
  {
    id: "onedrive", name: "OneDrive", desc: "Microsoft OneDrive",
    status: "connected", color: "#0078D4", icon: "OD",
    authFields: [
      { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Azure Tenant ID" },
      { key: "client_id", label: "Client ID", type: "text", placeholder: "App Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "App Secret" },
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

const IconBox: React.FC<{ conn: Connector; size?: number }> = ({ conn, size = 36 }) => (
  <Tooltip title={conn.name} placement="right">
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: conn.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 2px 6px ${conn.color}33`,
      }}
    >
      <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: conn.icon.length > 2 ? 9 : conn.icon.length > 1 ? 10 : 13, lineHeight: 1 }}>
        {conn.icon}
      </Typography>
    </Box>
  </Tooltip>
);

const StatusBadge: React.FC<{ connected: boolean }> = ({ connected }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      px: 1,
      py: 0.35,
      borderRadius: 999,
      bgcolor: connected ? "#e8f5e9" : "#f5f5f5",
      border: connected ? "1px solid #c8e6c9" : "1px solid #e0e0e0",
    }}
  >
    {connected ? (
      <CheckCircle sx={{ fontSize: 12, color: "#2e7d32" }} />
    ) : (
      <WifiOff sx={{ fontSize: 12, color: "#9e9e9e" }} />
    )}
    <Typography fontSize={10.5} color={connected ? "#1b5e20" : "#757575"} fontWeight={700}>
      {connected ? "CONNECTED" : "DISCONNECTED"}
    </Typography>
  </Box>
);

interface DialogProps {
  conn: Connector | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, displayName: string) => void;
}

const ConnectDialog: React.FC<DialogProps> = ({ conn, open, onClose, onSuccess }) => {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!conn) return null;

  const set = (k: string, v: string) => {
    setVals((p) => ({ ...p, [k]: v }));
    setError(null);
  };

  const handleClose = () => {
    setVals({});
    setError(null);
    onClose();
  };

  const handleConnect = async () => {
    if (!conn.authFields.every((f) => vals[f.key]?.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (conn.id === "confluence") {
        const res = await fetch("http://localhost:8000/api/connect/confluence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: vals["domain"],
            email: vals["email"],
            api_token: vals["api_token"],
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail ?? data.message ?? "Connection failed");
        onSuccess(conn.id, data.user?.displayName || vals["email"]);
        handleClose();
      } else {
        await new Promise((r) => setTimeout(r, 900));
        onSuccess(conn.id, "");
        handleClose();
      }
    } catch (e: any) {
      setError(e.message ?? "Unable to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, pr: 1.5 }}>
        <IconBox conn={conn} size={38} />
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} fontSize={15} noWrap>
            {conn.status === "connected" ? `Manage ${conn.name}` : `Connect to ${conn.name}`}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {conn.desc}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={1.5}>
          {conn.id === "confluence" && (
            <Alert
              severity="info"
              icon={<OpenInNew fontSize="small" />}
              sx={{ fontSize: 12, alignItems: "center" }}
              action={
                <Button
                  size="small"
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  sx={{ fontSize: 11, fontWeight: 700 }}
                >
                  Get Token
                </Button>
              }
            >
              Generate your API token from Atlassian account settings.
            </Alert>
          )}

          {conn.authFields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type}
              placeholder={f.placeholder}
              helperText={f.helperText}
              value={vals[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              fullWidth
              size="small"
              FormHelperTextProps={{ sx: { fontSize: 11 } }}
            />
          ))}

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 2, p: 1.25 }}>
            <Security sx={{ fontSize: 17, color: "#0369a1" }} />
            <Typography fontSize={12} color="#0369a1">
              Credentials are encrypted and stored securely.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.2 }}>
        <Button onClick={handleClose} color="inherit" size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}
          size="small"
        >
          {loading ? "Connecting..." : conn.status === "connected" ? "Update" : "Connect"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ConnectorCard: React.FC<{ conn: Connector; onOpen: (c: Connector) => void }> = ({ conn, onOpen }) => {
  const isConnected = conn.status === "connected";

  return (
    <Paper
      onClick={() => onOpen(conn)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.1,
        mb: 0.9,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "0.18s ease",
        "&:hover": {
          bgcolor: "#fafafa",
          boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <IconBox conn={conn} size={36} />

      <Box flex={1} minWidth={0}>
        <Typography fontWeight={700} fontSize={13.5} color="#111827" noWrap sx={{ lineHeight: 1.2 }}>
          {conn.name}
        </Typography>
        <Typography fontSize={11} color="text.secondary" noWrap sx={{ mt: 0.15 }}>
          {conn.desc}
        </Typography>
        <Box sx={{ mt: 0.55 }}>
          <StatusBadge connected={isConnected} />
        </Box>
      </Box>

      <Button
        size="small"
        variant={isConnected ? "outlined" : "contained"}
        startIcon={isConnected ? <Settings sx={{ fontSize: 14 }} /> : <LinkIcon sx={{ fontSize: 14 }} />}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(conn);
        }}
        sx={{
          minWidth: 102,
          height: 32,
          textTransform: "none",
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 2,
          ...(isConnected
            ? { color: "#64748b", borderColor: "#d1d5db" }
            : { bgcolor: "#1565c0" }),
        }}
      >
        {isConnected ? "Manage" : "Connect"}
      </Button>
    </Paper>
  );
};

interface ConnectSourcesProps {
  onConfluenceConnected?: (displayName: string) => void;
}

const ConnectSources: React.FC<ConnectSourcesProps> = ({ onConfluenceConnected }) => {
  const [connectors, setConnectors] = useState<Connector[]>(INIT_CONNECTORS);
  const [selected, setSelected] = useState<Connector | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = (id: string, displayName: string) => {
    setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, status: "connected" } : c)));
    if (id === "confluence" && onConfluenceConnected) onConfluenceConnected(displayName);
  };

  const connectedCount = connectors.filter((c) => c.status === "connected").length;
  const totalCount = connectors.length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#fff",
        borderLeft: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.4,
          borderBottom: "1px solid #e5e7eb",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon sx={{ fontSize: 17, color: "#1565c0" }} />
          <Box>
            <Typography fontWeight={700} fontSize={14} color="#111827">
              Connect Sources
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              Manage integrations
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${connectedCount} / ${totalCount}`}
          size="small"
          icon={<CheckCircle sx={{ fontSize: 14 }} />}
          sx={{ bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: 700, height: 24 }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1.25 }}>
        {connectors.map((c) => (
          <ConnectorCard
            key={c.id}
            conn={c}
            onOpen={(c) => {
              setSelected(c);
              setDialogOpen(true);
            }}
          />
        ))}
      </Box>

      <ConnectDialog
        conn={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default ConnectSources;