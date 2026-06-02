import React, { useState, useCallback, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, IconButton, Tooltip,
} from "@mui/material";
import { CloudUpload, PictureAsPdf, OpenInNew, Delete } from "@mui/icons-material";

interface UploadedFile {
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  source: "local" | "confluence";
  pageId?: string;
  url?: string;
}

const typeColor: Record<string, { bg: string; color: string }> = {
  PDF:        { bg: "#fde8e8", color: "#b91c1c" },
  BPMN:       { bg: "#ede9fe", color: "#6d28d9" },
  DOCX:       { bg: "#dbeafe", color: "#1e40af" },
  XLSX:       { bg: "#dcfce7", color: "#166534" },
  PPTX:       { bg: "#ffedd5", color: "#c2410c" },
  CONFLUENCE: { bg: "#e0edff", color: "#0052CC" },
};

const INITIAL_FILES: UploadedFile[] = [
  { name: "SOP_Employee_Onboarding.pdf", type: "PDF",  size: "2.37 MB", uploadedBy: "Alicia Roberts",   date: "May 16, 2025, 03 PM", source: "local" },
  { name: "Onboarding_Flow.bpmn",        type: "BPMN", size: "1.29 MB", uploadedBy: "Michael Roberts",  date: "May 16, 2025, 03 PM", source: "local" },
  { name: "HR_Policy_v3.docx",           type: "DOCX", size: "0.84 MB", uploadedBy: "Alicia Roberts",   date: "May 16, 2025, 03 PM", source: "local" },
  { name: "Role_Matrix.xlsx",            type: "XLSX", size: "1.12 MB", uploadedBy: "Michael Roberts",  date: "May 16, 2025, 03 PM", source: "local" },
  { name: "Process_Diagram.pptx",        type: "PPTX", size: "2.09 MB", uploadedBy: "Alicia Roberts",   date: "May 16, 2025, 03 PM", source: "local" },
];

interface UploadPanelProps {
  confluenceFile?: { pageId: string; title: string; spaceName: string; author: string } | null;
  onRemoveConfluence?: () => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ confluenceFile, onRemoveConfluence }) => {
  const [files, setFiles] = useState<UploadedFile[]>(INITIAL_FILES);
  const [dragging, setDragging] = useState(false);

  // When confluenceFile prop changes → add or remove from list
  useEffect(() => {
    if (confluenceFile) {
      const newFile: UploadedFile = {
        name: confluenceFile.title,
        type: "CONFLUENCE",
        size: "—",
        uploadedBy: confluenceFile.author || "Confluence",
        date: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        source: "confluence",
        pageId: confluenceFile.pageId,
      };
      // Remove old confluence files, add new one
      setFiles((prev) => [...prev.filter((f) => f.source !== "confluence"), newFile]);
    } else {
      // Remove confluence files if disconnected
      setFiles((prev) => prev.filter((f) => f.source !== "confluence"));
    }
  }, [confluenceFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = dropped.map((f) => ({
      name: f.name,
      type: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
      size: (f.size / 1024 / 1024).toFixed(2) + " MB",
      uploadedBy: "You",
      date: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      source: "local",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemove = (index: number, file: UploadedFile) => {
    if (file.source === "confluence" && onRemoveConfluence) onRemoveConfluence();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Drop Zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragging ? "#1565c0" : "#cbd5e1"}`,
          borderRadius: 2, bgcolor: dragging ? "#e3f2fd" : "#f8fafc",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", py: 4, gap: 1, cursor: "pointer", transition: "all .15s",
        }}
      >
        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CloudUpload sx={{ color: "#1565c0", fontSize: 26 }} />
        </Box>
        <Typography sx={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>
          Drag and drop files here or click to browse
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
          Supported file types: PDF, DOCX, XLSX, PPTX, PNG, BPMN, ZIP (Max 500 MB per file)
        </Typography>
        <Button variant="contained" size="small"
          sx={{ mt: 1, bgcolor: "#1565c0", fontWeight: 700, borderRadius: 1.5, boxShadow: "none", px: 3 }}>
          Choose Files
        </Button>
      </Box>

      {/* File Table */}
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1e293b", mb: 1.5 }}>
          Uploaded Files ({files.length})
        </Typography>
        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                {["FILE NAME", "TYPE", "SIZE", "UPLOADED BY", "DATE UPLOAD", ""].map((h) => (
                  <TableCell key={h} sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, py: 1.2, borderBottom: "1px solid #e2e8f0" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((f, i) => {
                const tc = typeColor[f.type] ?? { bg: "#f1f5f9", color: "#475569" };
                const isConfluence = f.source === "confluence";
                return (
                  <TableRow key={i} sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "&:last-child td": { borderBottom: 0 },
                    bgcolor: isConfluence ? "#f0f7ff" : "transparent",
                  }}>
                    {/* File Name */}
                    <TableCell sx={{ fontSize: 12, color: "#1e293b", fontWeight: 500, py: 1.2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <PictureAsPdf sx={{ fontSize: 12, color: tc.color }} />
                        </Box>
                        <Typography fontSize={12} fontWeight={500} color="#1e293b">{f.name}</Typography>
                        {isConfluence && (
                          <Chip label="Confluence" size="small"
                            sx={{ bgcolor: "#e0edff", color: "#0052CC", fontSize: 9, height: 16, fontWeight: 700, ml: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>

                    {/* Type */}
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={f.type} size="small"
                        sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 700, fontSize: 10, height: 20 }} />
                    </TableCell>

                    {/* Size */}
                    <TableCell sx={{ fontSize: 12, color: "#475569", py: 1.2 }}>{f.size}</TableCell>

                    {/* Uploaded By */}
                    <TableCell sx={{ fontSize: 12, color: "#475569", py: 1.2 }}>{f.uploadedBy}</TableCell>

                    {/* Date */}
                    <TableCell sx={{ fontSize: 12, color: "#94a3b8", py: 1.2 }}>{f.date}</TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 1.2 }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {isConfluence && f.url && (
                          <Tooltip title="Open in Confluence">
                            <IconButton size="small" href={f.url} target="_blank" sx={{ p: 0.3 }}>
                              <OpenInNew sx={{ fontSize: 14, color: "#1565c0" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => handleRemove(i, f)} sx={{ p: 0.3 }}>
                            <Delete sx={{ fontSize: 14, color: "#94a3b8" }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default UploadPanel;