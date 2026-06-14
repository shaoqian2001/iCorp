"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  sourceRepository,
  type SourceKind,
  type SourceStatus,
} from "@/lib/data";
import {
  SOURCE_KINDS,
  SOURCE_KIND_LABEL,
  SOURCE_STATUSES,
  SOURCE_STATUS_LABEL,
} from "./projectMeta";

interface SourceDraft {
  id?: string;
  title: string;
  url: string;
  authors: string;
  kind: SourceKind;
  status: SourceStatus;
  notes: string;
}

const NEW_SOURCE: SourceDraft = {
  title: "",
  url: "",
  authors: "",
  kind: "article",
  status: "to_read",
  notes: "",
};

// Reading-list order: in progress, then queued, then done.
const STATUS_ORDER: Record<SourceStatus, number> = {
  reading: 0,
  to_read: 1,
  read: 2,
};

const isLink = (url: string) => /^https?:\/\//i.test(url);

export function SourcesPanel({ projectId }: { projectId: string }) {
  const sources = useLiveQuery(
    () => sourceRepository.listByProject(projectId),
    [projectId],
  );
  const [draft, setDraft] = useState<SourceDraft | null>(null);

  const ordered = (sources ?? [])
    .slice()
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.title.localeCompare(b.title),
    );

  const save = async () => {
    if (!draft || !draft.title.trim()) return;
    const payload = {
      projectId,
      title: draft.title.trim(),
      url: draft.url.trim() || undefined,
      authors: draft.authors.trim() || undefined,
      kind: draft.kind,
      status: draft.status,
      notes: draft.notes.trim() || undefined,
    };
    if (draft.id) await sourceRepository.update(draft.id, payload);
    else await sourceRepository.create(payload);
    setDraft(null);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6">Sources</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setDraft({ ...NEW_SOURCE })}
        >
          Add source
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        {sources === undefined ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : ordered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No sources yet. Add papers, articles, books, and datasets to build
            your reading list.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={1.5}>
            {ordered.map((source) => (
              <Stack
                key={source.id}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {source.url && isLink(source.url) ? (
                    <Link href={source.url} target="_blank" rel="noopener">
                      {source.title}
                    </Link>
                  ) : (
                    <Typography>{source.title}</Typography>
                  )}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 0.25 }}
                  >
                    <Chip size="small" variant="outlined" label={SOURCE_KIND_LABEL[source.kind]} />
                    {source.authors ? (
                      <Typography variant="caption" color="text.secondary">
                        {source.authors}
                      </Typography>
                    ) : null}
                    {source.url && !isLink(source.url) ? (
                      <Typography variant="caption" color="text.secondary">
                        {source.url}
                      </Typography>
                    ) : null}
                  </Stack>
                  {source.notes ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                    >
                      {source.notes}
                    </Typography>
                  ) : null}
                </Box>
                <TextField
                  select
                  size="small"
                  value={source.status}
                  onChange={(e) =>
                    void sourceRepository.update(source.id, {
                      status: e.target.value as SourceStatus,
                    })
                  }
                  sx={{ minWidth: 120 }}
                >
                  {SOURCE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {SOURCE_STATUS_LABEL[status]}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setDraft({
                        id: source.id,
                        title: source.title,
                        url: source.url ?? "",
                        authors: source.authors ?? "",
                        kind: source.kind,
                        status: source.status,
                        notes: source.notes ?? "",
                      })
                    }
                    aria-label="Edit source"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => void sourceRepository.remove(source.id)}
                    aria-label="Delete source"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={draft !== null} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        <DialogTitle>{draft?.id ? "Edit source" : "Add source"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              autoFocus
              value={draft?.title ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, title: e.target.value } : d))
              }
            />
            <TextField
              label="URL or DOI"
              fullWidth
              value={draft?.url ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, url: e.target.value } : d))
              }
            />
            <TextField
              label="Authors"
              fullWidth
              value={draft?.authors ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, authors: e.target.value } : d))
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Kind"
                fullWidth
                value={draft?.kind ?? "article"}
                onChange={(e) =>
                  setDraft((d) =>
                    d ? { ...d, kind: e.target.value as SourceKind } : d,
                  )
                }
              >
                {SOURCE_KINDS.map((kind) => (
                  <MenuItem key={kind} value={kind}>
                    {SOURCE_KIND_LABEL[kind]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                fullWidth
                value={draft?.status ?? "to_read"}
                onChange={(e) =>
                  setDraft((d) =>
                    d ? { ...d, status: e.target.value as SourceStatus } : d,
                  )
                }
              >
                {SOURCE_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {SOURCE_STATUS_LABEL[status]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Notes"
              fullWidth
              multiline
              minRows={2}
              value={draft?.notes ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, notes: e.target.value } : d))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void save()} disabled={!draft?.title.trim()}>
            {draft?.id ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
