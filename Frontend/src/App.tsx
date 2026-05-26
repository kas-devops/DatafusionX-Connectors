import React, { useState, useEffect } from "react";
import { createTheme, ThemeProvider, CssBaseline, Box, Typography, Button, Avatar } from "@mui/material";
import { ArrowBack, ArrowForward, Verified } from "@mui/icons-material";
import Sidebar from "./components/Sidebar";
import TopStepper from "./components/TopStepper";
import UploadPanel from "./components/UploadPanel";
import ConnectSources from "./components/ConnectSources";
import AIAssistant from "./components/AIAssistant";

const theme = createTheme({
  palette: { primary: { main: "#1565c0" } },
  typography: { fontFamily: "'Inter', 'Roboto', sans-serif" },
  components: {
    MuiButton: { styleOverrides: { containedPrimary: { boxShadow: "none", "&:hover": { boxShadow: "none" } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 14 } } },
    MuiTextField: { styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 8, fontSize: 13 } } } },
  },
});

interface ConfluencePage {
  pageId: string;
  title: string;
  spaceName: string;
  author: string;
}

const App: React.FC = () => {
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const [confluencePage, setConfluencePage] = useState<ConfluencePage | null>(null);
  const [confluenceConnected, setConfluenceConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string>("");

  // ── Restore connection state on page refresh ──────────────────────────────
  useEffect(() => {
    fetch("http://localhost:8000/api/confluence/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.connected) {
          setConfluenceConnected(true);
          setConnectedUser(d.user?.displayName || d.user?.email || "");
        }
      })
      .catch(() => {}); // backend not running — silently ignore
  }, []);

  const handlePageSelected = (pageId: string, pageTitle: string, spaceName: string) => {
    setConfluencePage({ pageId, title: pageTitle, spaceName, author: "Confluence" });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f8fafc", overflow: "hidden" }}>
        <Sidebar />

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Top Nav */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.2, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
            {/* Connection status badge */}
            {confluenceConnected && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 2, px: 1.5, py: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a" }} />
                {/* <Typography fontSize={12} fontWeight={600} color="#16a34a">
                  Confluence: {connectedUser}
                </Typography> */}
              </Box>
            )}
            {!confluenceConnected && <Box />}
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#1565c0", fontSize: 14, fontWeight: 700 }}>A</Avatar>
          </Box>

          {/* Stepper */}
          <Box sx={{ flexShrink: 0 }}>
            <TopStepper activeStep={0} />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Upload Panel */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
              <UploadPanel
                confluenceFile={confluencePage}
                onRemoveConfluence={() => setConfluencePage(null)}
              />
            </Box>

            {/* Connect Sources */}
            <Box sx={{ width: 320, flexShrink: 0, bgcolor: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <ConnectSources
                onConfluenceConnected={(displayName) => {
                  setConfluenceConnected(true);
                  setConnectedUser(displayName);
                }}
                onPageSelected={handlePageSelected}
              />
            </Box>

            {/* AI Assistant */}
            <AIAssistant collapsed={aiCollapsed} onToggle={() => setAiCollapsed((p) => !p)} />
          </Box>

          {/* Bottom Bar */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.5, bgcolor: "#fff", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
            <Typography fontSize={12} color="#94a3b8" fontWeight={500}>Step 2 of 10</Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button size="small" startIcon={<ArrowBack sx={{ fontSize: 15 }} />} sx={{ fontWeight: 700, color: "#475569", border: "1px solid #e2e8f0", borderRadius: 1.5, px: 2 }}>Back</Button>
              <Button size="small" variant="outlined" startIcon={<Verified sx={{ fontSize: 15 }} />} sx={{ fontWeight: 700, color: "#1565c0", borderColor: "#1565c0", borderRadius: 1.5, px: 2 }}>Validate</Button>
              <Button size="small" variant="contained" endIcon={<ArrowForward sx={{ fontSize: 15 }} />} sx={{ fontWeight: 700, bgcolor: "#1565c0", borderRadius: 1.5, px: 2.5, boxShadow: "none" }}>Next</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;