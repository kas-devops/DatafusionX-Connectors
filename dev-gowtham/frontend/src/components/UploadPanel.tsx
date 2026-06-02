import React, { useState } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
} from "@mui/material";
import { CloudUpload, Delete, InsertDriveFile, CheckCircle } from "@mui/icons-material";

interface UploadedFile {
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  source: string;
}

interface Props {
  externalFile?: { name: string; type: string; source: string } | null;
}

const UploadPanel: React.FC<Props> = ({ externalFile }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  React.useEffect(() => {
    if (externalFile) {
      const newFile: UploadedFile = {
        name: externalFile.name,
        type: externalFile.type || "FILE",
        size: "-",
        uploadedBy: "Gowtham",
        date: new Date().toLocaleString(),
        source: externalFile.source,
      };
      setFiles((prev) => [...prev, newFile]);
    }
  }, [externalFile]);

  const handleDelete = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sourceColor: Record<string, string> = {
    ONEDRIVE: "#0078D4",
    S3: "#FF9900",
    SERVICENOW: "#62D84E",
    LOCAL: "#64748b",
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflowY: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
          Upload / Connect Documents
        </Typography>
        <Button variant="outlined" startIcon={<CloudUpload />} size="small"
          sx={{ fontSize: 12, fontWeight: 600, borderColor: "#1565c0", color: "#1565c0" }}>
          Upload Files
        </Button>
      </Box>

      {files.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: "2px dashed #e2e8f0", borderRadius: 2, py: 6, color: "#94a3b8" }}>
          <CloudUpload sx={{ fontSize: 40, mb: 1, color: "#cbd5e1" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>No files yet</Typography>
          <Typography sx={{ fontSize: 12 }}>Upload files or connect a source on the right</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>FILE NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>SOURCE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>UPLOADED BY</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>OCR & PARSING</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file, index) => (
                <TableRow key={index} sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InsertDriveFile sx={{ fontSize: 16, color: "#1565c0" }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#1e293b" }}>{file.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={file.source} size="small"
                      sx={{ bgcolor: sourceColor[file.source] || "#64748b", color: "#fff", fontWeight: 700, fontSize: 10, height: 20 }} />
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 12, color: "#64748b" }}>{file.type}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: 12, color: "#64748b" }}>{file.uploadedBy}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{file.date}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 14, color: "#16a34a" }} />
                      <Typography sx={{ fontSize: 11, color: "#16a34a" }}>Ready</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => handleDelete(index)}>
                        <Delete sx={{ fontSize: 15, color: "#ef4444" }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UploadPanel;