import React, { useState } from "react";
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider,
} from "@mui/material";
import {
  Hub, TableChart, Schedule, BarChart, Rule, Score, Inbox, AccountTree,
  VerifiedUser, AccountBalanceWallet, DataUsage, Calculate, Receipt,
} from "@mui/icons-material";


interface NavItem {
  label: string;
  icon: React.ReactNode;
}


interface Section {
  title: string;
  items: NavItem[];
}


const sections: Section[] = [
  {
    title: "Discover",
    items: [
      { label: "Metadata Extraction", icon: <Hub fontSize="small" /> },
      { label: "Connection Assignments", icon: <TableChart fontSize="small" /> },
      { label: "Pipeline Schedules", icon: <Schedule fontSize="small" /> },
    ],
  },
  {
    title: "Data Quality",
    items: [
      { label: "Data Profiling", icon: <BarChart fontSize="small" /> },
      { label: "Data Rules", icon: <Rule fontSize="small" /> },
      { label: "Score Card", icon: <Score fontSize="small" /> },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Workflow Inbox", icon: <Inbox fontSize="small" /> },
      { label: "Workflow Designer", icon: <AccountTree fontSize="small" /> },
      { label: "Approval Gates", icon: <VerifiedUser fontSize="small" /> },
    ],
  },
  {
    title: "Billing",
    items: [
      { label: "DBU Wallet", icon: <AccountBalanceWallet fontSize="small" /> },
      { label: "Usage & Metering", icon: <DataUsage fontSize="small" /> },
      { label: "TCO Calculator", icon: <Calculate fontSize="small" /> },
      { label: "Billing Statement", icon: <Receipt fontSize="small" /> },
    ],
  },
];


const Sidebar: React.FC = () => {
  const [active, setActive] = useState("Metadata Extraction");


  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: "#fafafa",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2.5, borderBottom: "1px solid #f3f4f6" }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <img 
            src="/logo.svg" 
            alt="DataFusionX.ai" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain",
              borderRadius: 2
            }} 
          />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827", letterSpacing: -0.3 }}>
          DataFusionX<span sx={{ color: "#1565c0" }}>.ai</span>
        </Typography>
      </Box>


      {/* Nav */}
      <Box sx={{ flex: 1, py: 2, px: 2, overflow: "hidden" }}>
        {sections.map((sec, idx) => (
          <Box key={sec.title}>
            <Typography
              sx={{
                fontSize: 11, 
                fontWeight: 700, 
                color: "#6b7280", 
                px: 2, 
                pt: idx === 0 ? 0 : 1.5, 
                pb: 0.75,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {sec.title}
            </Typography>
            <List dense disablePadding sx={{ gap: 0.25 }}>
              {sec.items.map((item) => (
                <ListItemButton
                  key={item.label}
                  selected={active === item.label}
                  onClick={() => setActive(item.label)}
                  sx={{
                    py: 1, 
                    px: 2,
                    mb: 0.25,
                    borderRadius: 2,
                    "&.Mui-selected": { 
                      bgcolor: "#e3f2fd", 
                      "& .MuiListItemText-primary": { color: "#1565c0", fontWeight: 600 },
                      "& .MuiListItemIcon-root": { color: "#1565c0" },
                      "&:hover": { bgcolor: "#bbdefb" }
                    },
                    "&:not(.Mui-selected):hover": { bgcolor: "#f3f4f6" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 32, 
                    color: active === item.label ? "#1565c0" : "#9ca3af",
                    transition: "color 0.2s ease"
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ 
                      fontSize: 13, 
                      color: active === item.label ? "#1565c0" : "#374151",
                      fontWeight: active === item.label ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
            {idx < sections.length - 1 && (
              <Divider sx={{ my: 1, borderColor: "#f3f4f6" }} />
            )}
          </Box>
        ))}
      </Box>


      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6", bgcolor: "#f9fafb" }}>
        <Typography sx={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          © 2026 DataFusionX.ai
        </Typography>
      </Box>
    </Box>
  );
};


export default Sidebar;