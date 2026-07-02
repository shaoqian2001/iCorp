"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  exportDatabaseToJson,
  goalRepository,
  importDatabaseFromJson,
  milestoneRepository,
  projectRepository,
  resetAndReseed,
  reviewRepository,
  taskRepository,
} from "@/lib/data";
import { CloudSyncPanel } from "./CloudSyncPanel";

type Feedback = { severity: "success" | "error"; message: string } | null;

export function SettingsView() {
  const counts = useLiveQuery(async () => {
    const [goals, projects, milestones, tasks, reviews] = await Promise.all([
      goalRepository.list(),
      projectRepository.list(),
      milestoneRepository.list(),
      taskRepository.list(),
      reviewRepository.list(),
    ]);
    return {
      Goals: goals.length,
      Projects: projects.length,
      Milestones: milestones.length,
      Tasks: tasks.length,
      Reviews: reviews.length,
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{
    name: string;
    text: string;
  } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleExport = async () => {
    try {
      const json = await exportDatabaseToJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `solo-studio-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setFeedback({ severity: "success", message: "Exported your data." });
    } catch {
      setFeedback({ severity: "error", message: "Export failed." });
    }
  };

  const handleFileChosen = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setPendingImport({ name: file.name, text });
    // allow re-selecting the same file later
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    const { text } = pendingImport;
    setPendingImport(null);
    try {
      await importDatabaseFromJson(text);
      setFeedback({ severity: "success", message: "Imported and replaced your data." });
    } catch {
      setFeedback({
        severity: "error",
        message: "Import failed: that file isn't a valid Solo Studio export.",
      });
    }
  };

  const confirmReset = async () => {
    setResetOpen(false);
    try {
      await resetAndReseed();
      setFeedback({ severity: "success", message: "Reset to fresh demo data." });
    } catch {
      setFeedback({ severity: "error", message: "Reset failed." });
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, maxWidth: 720, mx: "auto" }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio
        </Typography>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Typography color="text.secondary">
          Your data lives only in this browser. Back it up, restore it, or start
          fresh.
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <CloudSyncPanel />

        {counts ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                This workspace
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={3}>
                {Object.entries(counts).map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="h5">{value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Download your entire workspace as a single JSON file.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => void handleExport()}
            >
              Export JSON
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Restore from an exported file. This replaces everything currently
              in this browser.
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => void handleFileChosen(e.target.files?.[0])}
            />
            <Button
              variant="outlined"
              startIcon={<UploadOutlinedIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reset &amp; reseed
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Wipe this browser&apos;s data and reload the original demo content.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestartAltIcon />}
              onClick={() => setResetOpen(true)}
            >
              Reset &amp; reseed
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={pendingImport !== null} onClose={() => setPendingImport(null)}>
        <DialogTitle>Replace all data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Importing <strong>{pendingImport?.name}</strong> will replace
            everything currently stored in this browser. This can&apos;t be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingImport(null)}>Cancel</Button>
          <Button color="error" onClick={() => void confirmImport()}>
            Replace data
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset &amp; reseed?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This wipes your current workspace and restores the original demo
            data. This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => void confirmReset()}>
            Reset &amp; reseed
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback !== null}
        autoHideDuration={3500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
