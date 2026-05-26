import React from "react";
import {
  Box, Typography, LinearProgress, Chip, Divider, List,
  ListItem, ListItemIcon, ListItemText
} from "@mui/material";
import { SmartToy, CheckCircle, Warning, Info, TrendingUp } from "@mui/icons-material";

interface AIAssistantProps {
  issueCount: number;
}

const ScoreBar: React.FC<{ label: string; score: number; color: string }> = ({ label, score, color }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
      <Typography sx={{ fontSize: 11.5, color: "#475569", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color }}>{score}%</Typography>
    </Box>
    <LinearProgress variant="determinate" value={score}
      sx={{ height: 6, borderRadius: 3, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
  </Box>
);

const AIAssistant: React.FC<AIAssistantProps> = ({ issueCount }) => {
  const readiness = issueCount === 0 ? 0 : Math.min(100, issueCount * 25);
  const extraction = issueCount === 0 ? 0 : Math.min(100, issueCount * 20);
  const quality = issueCount === 0 ? 0 : Math.min(100, issueCount * 30);

  const insights = issueCount === 0
    ? [{ icon: <Info sx={{ fontSize: 14, color: "#0369a1" }} />, text: "Connect Jira and import issues to begin AI analysis.", color: "#e0f2fe" }]
    : [
        { icon: <CheckCircle sx={{ fontSize: 14, color: "#16a34a" }} />, text: `${issueCount} issue(s) ready for AI extraction.`, color: "#dcfce7" },
        { icon: <TrendingUp sx={{ fontSize: 14, color: "#7c3aed" }} />, text: "Process discovery can begin.", color: "#ede9fe" },
        { icon: <Warning sx={{ fontSize: 14, color: "#d97706" }} />, text: "Review issue priorities before proceeding.", color: "#fef3c7" },
      ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <SmartToy sx={{ fontSize: 17, color: "#7c3aed" }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>AI Assistant</Typography>
        <Chip label="LIVE" size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 9, height: 18 }} />
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.6, mb: 1.2 }}>ISSUE READINESS SUMMARY</Typography>
        <ScoreBar label="Import Readiness" score={readiness} color="#0052CC" />
        <ScoreBar label="Extraction Readiness" score={extraction} color="#7c3aed" />
        <ScoreBar label="Data Quality Score" score={quality} color="#16a34a" />
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 1.5, flex: 1, overflowY: "auto" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.6, mb: 1 }}>AI INSIGHTS</Typography>
        <List dense disablePadding>
          {insights.map((ins, i) => (
            <ListItem key={i} sx={{ bgcolor: ins.color, borderRadius: 1.5, mb: 0.8, px: 1.2, py: 0.8, alignItems: "flex-start" }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.2 }}>{ins.icon}</ListItemIcon>
              <ListItemText primary={ins.text} slotProps={{ primary: { style: { fontSize: 12, color: "#1e293b", lineHeight: 1.5 } } }} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ px: 2, py: 1.2, borderTop: "1px solid #e2e8f0", bgcolor: "#fafafa" }}>
        <Typography sx={{ fontSize: 10.5, color: "#94a3b8", textAlign: "center" }}>
          Powered by DataFusionX AI · Step 2 of 10
        </Typography>
      </Box>
    </Box>
  );
};

export default AIAssistant;