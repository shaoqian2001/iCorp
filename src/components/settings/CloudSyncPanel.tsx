"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import LoginIcon from "@mui/icons-material/Login";
import { backupToCloud, restoreFromCloud } from "@/lib/cloud/sync";
import { getAutoBackup, getLastSynced, setAutoBackup } from "@/lib/cloud/prefs";

type Feedback = { severity: "success" | "error"; message: string } | null;

export function CloudSyncPanel() {
  const { data: session, status } = useSession();
  const [autoBackup, setAutoBackupState] = useState(false);
  const [lastSynced, setLastSyncedState] = useState<string | null>(null);
  const [busy, setBusy] = useState<"backup" | "restore" | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setAutoBackupState(getAutoBackup());
    setLastSyncedState(getLastSynced());
  }, []);

  const doBackup = async () => {
    setBusy("backup");
    setFeedback(null);
    try {
      const ts = await backupToCloud();
      setLastSyncedState(ts);
      setFeedback({ severity: "success", message: "Backed up to the cloud." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Backup failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    setConfirmRestore(false);
    setBusy("restore");
    setFeedback(null);
    try {
      const ts = await restoreFromCloud();
      if (ts === null) {
        setFeedback({
          severity: "error",
          message: "No cloud backup found yet — back up first.",
        });
      } else {
        setLastSyncedState(ts);
        setFeedback({ severity: "success", message: "Restored from the cloud." });
      }
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Restore failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const toggleAuto = (value: boolean) => {
    setAutoBackup(value);
    setAutoBackupState(value);
  };

  const lastSyncedLabel = lastSynced
    ? format(parseISO(lastSynced), "d MMM yyyy, HH:mm")
    : "never";

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Account &amp; cloud sync
        </Typography>

        {status === "loading" ? (
          <CircularProgress size={20} />
        ) : !session?.user ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Your data lives in this browser by default. Sign in to back it up
              to the cloud and access it from other devices.
            </Typography>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => void signIn("github")}
            >
              Sign in with GitHub
            </Button>
          </>
        ) : (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Signed in as{" "}
              <strong>{session.user.name || session.user.email}</strong>. Last
              backup: {lastSyncedLabel}.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={() => void doBackup()}
                disabled={busy !== null}
              >
                {busy === "backup" ? "Backing up…" : "Back up now"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadOutlinedIcon />}
                onClick={() => setConfirmRestore(true)}
                disabled={busy !== null}
              >
                {busy === "restore" ? "Restoring…" : "Restore from cloud"}
              </Button>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={autoBackup}
                  onChange={(e) => toggleAuto(e.target.checked)}
                />
              }
              label="Auto-backup after changes"
            />
            <Divider />
            <Box>
              <Button color="inherit" size="small" onClick={() => void signOut()}>
                Sign out
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>

      <Dialog open={confirmRestore} onClose={() => setConfirmRestore(false)}>
        <DialogTitle>Restore from cloud?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This replaces everything currently in this browser with your cloud
            backup. This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestore(false)}>Cancel</Button>
          <Button color="error" onClick={() => void doRestore()}>
            Replace local data
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
    </Card>
  );
}
