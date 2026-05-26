import React from "react";
import { Box, Button, Typography, LinearProgress } from "@mui/material";
import { Save, CheckCircle, ArrowForward, ArrowBack } from "@mui/icons-material";

interface BottomBarProps {
  onSaveDraft?: () => void;
  onValidate?: () => void;
  onNext?: () => void;
  onBack?: () => void;
  issueCount?: number;
}

const BottomBar: React.FC<BottomBarProps> = ({ onSaveDraft, onValidate, onNext, onBack, issueCount = 0 }) => {
  const progress = (2 / 10) * 100;

  return (
    <Box sx={{ borderTop: "1px solid #e2e8f0", bgcolor: "#fff", px: 2.5, py: 1.2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.8 }}>
        <Typography sx={{ fontSize: 10.5, color: "#94a3b8", mr: 1, whiteSpace: "nowrap" }}>Step 2 of 10</Typography>
        <LinearProgress variant="determinate" value={progress}
          sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: "#f1f5f9",
            "& .MuiLinearProgress-bar": { bgcolor: "#0052CC", borderRadius: 3 } }} />
        <Typography sx={{ fontSize: 10.5, color: "#0052CC", ml: 1, fontWeight: 700 }}>20%</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            {issueCount === 0 ? "No issues imported yet" : `${issueCount} issue(s) ready`}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            onClick={onBack}
            sx={{ fontSize: 12, fontWeight: 600, borderColor: "#e2e8f0", color: "#64748b", textTransform: "none" }}>
            Back
          </Button>
          <Button size="small" variant="outlined" startIcon={<Save sx={{ fontSize: 14 }} />}
            onClick={onSaveDraft}
            sx={{ fontSize: 12, fontWeight: 600, borderColor: "#0052CC", color: "#0052CC", textTransform: "none" }}>
            Save as Draft
          </Button>
          <Button size="small" variant="outlined" startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
            onClick={onValidate}
            sx={{ fontSize: 12, fontWeight: 600, borderColor: "#16a34a", color: "#16a34a", textTransform: "none" }}>
            Validate
          </Button>
          <Button size="small" variant="contained" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            onClick={onNext} disabled={issueCount === 0}
            sx={{ fontSize: 12, fontWeight: 700, bgcolor: "#0052CC", textTransform: "none", boxShadow: "none",
              "&:hover": { bgcolor: "#003a99" }, "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" } }}>
            Next Step
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BottomBar;