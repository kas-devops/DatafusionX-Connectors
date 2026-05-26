import React, { useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import Sidebar from "./components/Sidebar";
import TopStepper from "./components/TopStepper";
import IssuePanel, { ImportedIssue } from "./components/IssuePanel";
import JiraConnect from "./components/JiraConnect";
import AIAssistant from "./components/AIAssistant";
import BottomBar from "./components/BottomBar";

let idCounter = 1;

const App: React.FC = () => {
  const [issues, setIssues] = useState<ImportedIssue[]>([]);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "info" }>({
    open: false, msg: "", severity: "success",
  });

  const showSnack = (msg: string, severity: "success" | "info" = "success") =>
    setSnack({ open: true, msg, severity });

  const handleIssueSelected = (issue: any) => {
    const newIssue: ImportedIssue = {
      id: String(idCounter++),
      key: issue.key,
      summary: issue.fields.summary,
      project: issue.fields.project.name,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name ?? "Medium",
      importedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    };
    setIssues((prev) => [...prev, newIssue]);
    showSnack(`"${issue.key}" imported from Jira!`);
  };

  const handleDelete = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    showSnack("Issue removed.", "info");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "#f8fafc" }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Stepper */}
        <TopStepper />

        {/* Page Title */}
        <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid #e2e8f0", bgcolor: "#fff" }}>
          <Box sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Step 2: Upload / Connect Documents
          </Box>
          <Box sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
            Connect to Jira and import issues as process artifacts for AI discovery.
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Issue Panel — center */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #e2e8f0", overflow: "hidden" }}>
            <IssuePanel issues={issues} onDelete={handleDelete} />
          </Box>

          {/* Jira Connect — right panel */}
          <Box sx={{ width: 300, borderRight: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <JiraConnect
              onConnected={() => showSnack("Jira connected!", "success")}
              onIssueSelected={handleIssueSelected}
            />
          </Box>

          {/* AI Assistant — far right */}
          <Box sx={{ width: 240, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <AIAssistant issueCount={issues.length} />
          </Box>
        </Box>

        {/* Bottom Bar */}
        <BottomBar
          issueCount={issues.length}
          onSaveDraft={() => showSnack("Draft saved!", "info")}
          onValidate={() => showSnack("Validation passed!", "success")}
          onNext={() => showSnack("Moving to Step 3...", "info")}
          onBack={() => showSnack("Going back to Step 1...", "info")}
        />
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontSize: 13 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default App;