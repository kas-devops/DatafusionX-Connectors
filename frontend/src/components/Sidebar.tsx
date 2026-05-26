import React, { useState } from "react";
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Dashboard, SmartToy, FolderOpen, TrackChanges, Hub, TableChart, Schedule, BarChart, Rule, Score, Inbox, AccountTree, VerifiedUser, AccountBalanceWallet, DataUsage, Calculate, Receipt } from "@mui/icons-material";

const sections = [
  { title: null, items: [{ label: "Dashboard", icon: <Dashboard fontSize="small" /> }, { label: "AI Assistant", icon: <SmartToy fontSize="small" /> }, { label: "Browse", icon: <FolderOpen fontSize="small" /> }, { label: "Audit Trail", icon: <TrackChanges fontSize="small" /> }] },
  { title: "PREPARE", items: [{ label: "Process Parser", icon: <Hub fontSize="small" /> }, { label: "Intake", icon: <TableChart fontSize="small" /> }] },
  { title: "DISCOVER", items: [{ label: "Metadata Extraction", icon: <Hub fontSize="small" /> }, { label: "Connection Assignments", icon: <TableChart fontSize="small" /> }, { label: "Pipeline Schedules", icon: <Schedule fontSize="small" /> }] },
  { title: "DATA QUALITY", items: [{ label: "Data Profiling", icon: <BarChart fontSize="small" /> }, { label: "Data Rules", icon: <Rule fontSize="small" /> }, { label: "Score Card", icon: <Score fontSize="small" /> }] },
  { title: "GOVERNANCE", items: [{ label: "Workflow Inbox", icon: <Inbox fontSize="small" /> }, { label: "Workflow Designer", icon: <AccountTree fontSize="small" /> }, { label: "Approval Gates", icon: <VerifiedUser fontSize="small" /> }] },
  { title: "BILLING", items: [{ label: "DBU Wallet", icon: <AccountBalanceWallet fontSize="small" /> }, { label: "Usage & Metering", icon: <DataUsage fontSize="small" /> }, { label: "TCO Calculator", icon: <Calculate fontSize="small" /> }, { label: "Billing Statement", icon: <Receipt fontSize="small" /> }] },
];

const Sidebar: React.FC = () => {
  const [active, setActive] = useState("Intake");
  return (
    <Box sx={{ width: 220, flexShrink: 0, bgcolor: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 2, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Hub sx={{ fontSize: 16, color: "#1565c0" }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>DataFusionX.ai</Typography>
      </Box>
      <Box sx={{ flex: 1, py: 1 }}>
        {sections.map((sec, si) => (
          <Box key={si}>
            {sec.title && <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#1565c0", px: 2, pt: 2, pb: 0.5, letterSpacing: 0.8 }}>{sec.title}</Typography>}
            <List dense disablePadding>
              {sec.items.map((item) => (
                <ListItemButton key={item.label} selected={active === item.label} onClick={() => setActive(item.label)}
                  sx={{ py: 0.75, px: 2, "&.Mui-selected": { bgcolor: "#e3f2fd" }, "&:hover": { bgcolor: "#f8fafc" }, borderRadius: "0 20px 20px 0", mr: 1 }}>
                  <ListItemIcon sx={{ minWidth: 28, color: active === item.label ? "#1565c0" : "#94a3b8" }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} slotProps={{ primary: { style: { fontSize: 12.5, color: "#475569" } } }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default Sidebar;