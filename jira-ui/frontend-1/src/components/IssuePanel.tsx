import React from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip
} from "@mui/material";
import { BugReport, Delete, CheckCircle, HourglassEmpty } from "@mui/icons-material";

export interface ImportedIssue {
  id: string;
  key: string;
  summary: string;
  project: string;
  status: string;
  priority: string;
  importedAt: string;
}

interface IssuePanelProps {
  issues: ImportedIssue[];
  onDelete: (id: string) => void;
}

const priorityColor: Record<string, string> = {
  Highest: "#dc2626", High: "#ea580c", Medium: "#d97706", Low: "#2563eb", Lowest: "#64748b",
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  "To Do": { bg: "#f1f5f9", color: "#475569" },
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  "Done": { bg: "#dcfce7", color: "#16a34a" },
};

const IssuePanel: React.FC<IssuePanelProps> = ({ issues, onDelete }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5, borderBottom: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BugReport sx={{ fontSize: 17, color: "#0052CC" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Imported Jira Issues</Typography>
          <Chip label={issues.length} size="small" sx={{ bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: 700, fontSize: 11, height: 20 }} />
        </Box>
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {["Key", "Summary", "Project", "Status", "Priority", "Imported At", ""].map((h) => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", bgcolor: "#f8fafc", py: 1, borderBottom: "1px solid #e2e8f0" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                  <BugReport sx={{ fontSize: 36, color: "#e2e8f0", display: "block", mx: "auto", mb: 1 }} />
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No issues yet. Connect Jira and import issues.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue) => {
                const st = statusStyle[issue.status] ?? { bg: "#f1f5f9", color: "#475569" };
                return (
                  <TableRow key={issue.id} sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0052CC" }}>{issue.key}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography noWrap sx={{ fontSize: 12.5, color: "#1e293b" }}>{issue.summary}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "#475569" }}>{issue.project}</TableCell>
                    <TableCell>
                      <Chip label={issue.status} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: 10.5, height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: priorityColor[issue.priority] ?? "#64748b" }} />
                        <Typography sx={{ fontSize: 11.5, color: priorityColor[issue.priority] ?? "#64748b" }}>{issue.priority}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{issue.importedAt}</TableCell>
                    <TableCell>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => onDelete(issue.id)} sx={{ color: "#e53e3e" }}>
                          <Delete sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default IssuePanel;