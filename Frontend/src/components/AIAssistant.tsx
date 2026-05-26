import React from "react";
import {
  Box, Typography, LinearProgress, Chip, IconButton,
} from "@mui/material";
import {
  CheckCircle, RadioButtonUnchecked, AutoAwesome, ChevronRight, ChevronLeft,
} from "@mui/icons-material";

const AIAssistant: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  if (collapsed) {
    return (
      <Box sx={{ width: 32, bgcolor: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", pt: 2 }}>
        <IconButton size="small" onClick={onToggle}><ChevronLeft fontSize="small" /></IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 260, flexShrink: 0, bgcolor: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesome sx={{ fontSize: 16, color: "#7c3aed" }} />
          <Typography fontWeight={700} fontSize={13} color="#0f172a">AI Assistant</Typography>
          <Chip label="Beta" size="small" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontSize: 9, height: 18, fontWeight: 700 }} />
        </Box>
        <IconButton size="small" onClick={onToggle}><ChevronRight fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ px: 2, py: 2, borderBottom: "1px solid #f1f5f9" }}>
        <Typography fontSize={11} fontWeight={700} color="#94a3b8" letterSpacing={0.5} mb={1}>FILE READINESS SUMMARY</Typography>
        <Box sx={{ display: "flex", gap: 3, mb: 1.5 }}>
          <Box>
            <Typography fontSize={10} color="#94a3b8">Files uploaded</Typography>
            <Typography fontSize={24} fontWeight={700} color="#1e293b" lineHeight={1}>5</Typography>
          </Box>
          <Box>
            <Typography fontSize={10} color="#94a3b8">Successfully parsed</Typography>
            <Typography fontSize={24} fontWeight={700} color="#2e7d32" lineHeight={1}>5</Typography>
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, bgcolor: "#e2e8f0", mb: 0.8, "& .MuiLinearProgress-bar": { bgcolor: "#1565c0", borderRadius: 3 } }} />
        <Typography fontSize={11} color="#475569">Parsing success rate: <b>100%</b></Typography>
        <Typography fontSize={11} color="#94a3b8">Total size: 7.71 MB</Typography>
      </Box>

      <Box sx={{ px: 2, py: 2, borderBottom: "1px solid #f1f5f9" }}>
        <Typography fontSize={11} fontWeight={700} color="#94a3b8" letterSpacing={0.5} mb={1}>EXTRACTION READINESS SCORE</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography fontSize={28} fontWeight={700} color="#2e7d32">92%</Typography>
          <CheckCircle sx={{ color: "#2e7d32", fontSize: 22 }} />
        </Box>
        <Typography fontSize={11} color="#475569" fontStyle="italic">Excellent — High readiness for AI discovery.</Typography>
      </Box>

      <Box sx={{ px: 2, py: 2, borderBottom: "1px solid #f1f5f9" }}>
        <Typography fontSize={11} fontWeight={700} color="#94a3b8" letterSpacing={0.5} mb={1.5}>AI RECOMMENDATIONS</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <CheckCircle sx={{ fontSize: 14, color: "#2e7d32", mt: 0.2, flexShrink: 0 }} />
            <Typography fontSize={12} color="#1e293b">High-quality artifacts uploaded</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <RadioButtonUnchecked sx={{ fontSize: 14, color: "#1565c0", mt: 0.2, flexShrink: 0 }} />
            <Typography fontSize={12} color="#1e293b">Consider connecting SharePoint and Confluence for additional context</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2 }}>
        <Typography fontSize={11} fontWeight={700} color="#94a3b8" letterSpacing={0.5} mb={1.5}>WHAT THIS STEP CAPTURES</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {["Process documents, diagrams, and policies", "Supporting data and reference files"].map((item) => (
            <Box key={item} sx={{ display: "flex", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 13, color: "#2e7d32", mt: 0.2, flexShrink: 0 }} />
              <Typography fontSize={12} color="#475569">{item}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AIAssistant;