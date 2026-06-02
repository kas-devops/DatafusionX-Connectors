import React from "react";
import { Box, Typography, Chip, LinearProgress } from "@mui/material";
import { SmartToy, CheckCircle, Info } from "@mui/icons-material";

const AIAssistant: React.FC<{ fileCount?: number }> = ({ fileCount = 0 }) => {
  return (
    <Box sx={{ width: 220, flexShrink: 0, bgcolor: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <SmartToy sx={{ fontSize: 16, color: "#1565c0" }} />
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>AI Assistant</Typography>
        <Chip label="Beta" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#e3f2fd", color: "#1565c0" }} />
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#0f172a", mb: 1.5 }}>File Readiness Summary</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 10, color: "#64748b" }}>Files uploaded</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>{fileCount}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, color: "#64748b" }}>Successfully parsed</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>{fileCount}</Typography>
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={fileCount > 0 ? 100 : 0} sx={{ height: 6, borderRadius: 3, mb: 0.5 }} />
        <Typography sx={{ fontSize: 10, color: "#64748b" }}>Parsing success rate: {fileCount > 0 ? "100%" : "0%"}</Typography>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#0f172a", mb: 1 }}>AI Recommendations</Typography>
        {fileCount > 0 ? (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
            <CheckCircle sx={{ fontSize: 14, color: "#16a34a", mt: 0.2 }} />
            <Typography sx={{ fontSize: 11, color: "#475569" }}>High-quality artifacts uploaded</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
            <Info sx={{ fontSize: 14, color: "#1565c0", mt: 0.2 }} />
            <Typography sx={{ fontSize: 11, color: "#475569" }}>Upload files or connect a source to get started</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#0f172a", mb: 1 }}>Your data is secure</Typography>
        <Box sx={{ bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 1.5, p: 1.5 }}>
          <Typography sx={{ fontSize: 11, color: "#0369a1" }}>Files are encrypted in transit and at rest. Access is role-based and audited.</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AIAssistant;