import React from "react";
import { Box, Typography } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const steps = [
  { num: 1, label: "Process Intake", sub: "Create & capture process", done: true },
  { num: 2, label: "Upload / Connect Documents", sub: "Add artifacts", active: true },
  { num: 3, label: "AI Process Discovery", sub: "Extract & understand" },
  { num: 4, label: "Process Normalization", sub: "Standardize & validate" },
  { num: 5, label: "SME Review", sub: "Human validation" },
  { num: 6, label: "RACI Assignment", sub: "Define ownership" },
  { num: 7, label: "Governance Checklist", sub: "Validate readiness" },
  { num: 8, label: "Approval Gate (AG)", sub: "Multi-stage approval" },
  { num: 9, label: "Evidence Pack", sub: "Generate audit evidence" },
  { num: 10, label: "Publish to Platforms", sub: "Publish to ecosystem" },
];

const TopStepper: React.FC = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
      {steps.map((step, index) => (
        <Box key={step.num} sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexShrink: 0 }}>
            {step.done ? (
              <CheckCircle sx={{ fontSize: 20, color: "#16a34a" }} />
            ) : (
              <Box sx={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: step.active ? "#1565c0" : "#e2e8f0", color: step.active ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: 700 }}>{step.num}</Box>
            )}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: step.active ? 700 : 500, color: step.active ? "#1565c0" : step.done ? "#16a34a" : "#64748b", whiteSpace: "nowrap" }}>{step.label}</Typography>
              <Typography sx={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap" }}>{step.sub}</Typography>
            </Box>
          </Box>
          {index < steps.length - 1 && <Box sx={{ width: 20, height: 1, bgcolor: "#e2e8f0", mx: 1, flexShrink: 0 }} />}
        </Box>
      ))}
    </Box>
  );
};
export default TopStepper;