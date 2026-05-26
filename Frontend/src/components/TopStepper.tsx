import React from "react";
import { Box, Typography, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses } from "@mui/material";
import { styled } from "@mui/material/styles";

const steps = [
  { num: 3, label: "AI Process Discovery", sub: "Extract & understand" },
  { num: 4, label: "Process Normalization", sub: "Standardize & validate" },
  { num: 5, label: "SME Review", sub: "Human validation" },
  { num: 6, label: "RACI Assignment", sub: "Define ownership" },
  { num: 7, label: "Governance Checklist", sub: "Validate readiness" },
  { num: 8, label: "Approval Gate (AG)", sub: "Multi-stage approval" },
  { num: 9, label: "Evidence Pack", sub: "Generate audit evidence" },
  { num: 10, label: "Publish to Platforms", sub: "Publish to ecosystem" },
];

const Connector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#1565c0" },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#1565c0" },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "#e2e8f0",
    borderTopWidth: 2,
  },
}));

const TopStepper: React.FC<{ activeStep?: number }> = ({ activeStep = 0 }) => {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        px: 3,
        py: 1.5,
        overflowX: "auto",
      }}
    >
      <Box sx={{ display: "flex", gap: 0, minWidth: 900 }}>
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <Box
              key={step.num}
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flex: 1,
                  cursor: "pointer",
                  opacity: isDone ? 0.5 : 1,
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: isActive ? "#1565c0" : isDone ? "#c8e6c9" : "#f1f5f9",
                    border: isActive ? "2px solid #1565c0" : "2px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: isActive ? "#fff" : "#94a3b8" }}>
                    {step.num}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#1565c0" : "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {step.sub}
                  </Typography>
                </Box>
              </Box>
              {idx < steps.length - 1 && (
                <Box sx={{ width: 20, height: 1, bgcolor: "#e2e8f0", flexShrink: 0, mx: 0.5 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default TopStepper;