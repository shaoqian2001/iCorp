"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  goalRepository,
  milestoneRepository,
  projectRepository,
  taskRepository,
  type ProjectStatus,
} from "@/lib/data";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
} from "./projectMeta";

interface Draft {
  id?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  goalId: string | null;
}

const NEW_DRAFT: Draft = {
  title: "",
  description: "",
  status: "active",
  goalId: null,
};

export function ProjectsView() {
  const projects = useLiveQuery(() => projectRepository.list(), []);
  const tasks = useLiveQuery(() => taskRepository.list(), []);
  const milestones = useLiveQuery(() => milestoneRepository.list(), []);
  const goals = useLiveQuery(() => goalRepository.list(), []);
  const [draft, setDraft] = useState<Draft | null>(null);

  const goalTitle = (goalId: string | null) =>
    goalId ? (goals ?? []).find((g) => g.id === goalId)?.title : undefined;
  const taskStats = (projectId: string) => {
    const list = (tasks ?? []).filter((t) => t.projectId === projectId);
    return { total: list.length, done: list.filter((t) => t.status === "done").length };
  };
  const milestoneCount = (projectId: string) =>
    (milestones ?? []).filter((m) => m.projectId === projectId).length;

  const save = async () => {
    if (!draft || !draft.title.trim()) return;
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      status: draft.status,
      goalId: draft.goalId,
    };
    if (draft.id) await projectRepository.update(draft.id, payload);
    else await projectRepository.create(payload);
    setDraft(null);
  };

  const ordered = (projects ?? [])
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 4 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary">
            Solo Studio
          </Typography>
          <Typography variant="h4" component="h1">
            Projects
          </Typography>
          <Typography color="text.secondary">
            Each project gathers its own tasks, milestones, and goal.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDraft({ ...NEW_DRAFT })}
        >
          New project
        </Button>
      </Stack>

      {projects === undefined ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : ordered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ mb: 2 }}>
            No projects yet. Create one to start organizing your work.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDraft({ ...NEW_DRAFT })}
          >
            Create your first project
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          }}
        >
          {ordered.map((project) => {
            const stats = taskStats(project.id);
            return (
              <Card key={project.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Typography
                      variant="h6"
                      component={NextLink}
                      href={`/projects/${project.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "inherit",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {project.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={PROJECT_STATUS_LABEL[project.status]}
                      color={PROJECT_STATUS_COLOR[project.status]}
                    />
                  </Stack>
                  {project.description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {project.description}
                    </Typography>
                  ) : null}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 1.5 }}
                  >
                    {goalTitle(project.goalId) ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Goal: ${goalTitle(project.goalId)}`}
                      />
                    ) : null}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${stats.done}/${stats.total} tasks`}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${milestoneCount(project.id)} milestones`}
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    sx={{ mt: 1 }}
                  >
                    <Button
                      size="small"
                      component={NextLink}
                      href={`/projects/${project.id}`}
                    >
                      Open
                    </Button>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setDraft({
                            id: project.id,
                            title: project.title,
                            description: project.description ?? "",
                            status: project.status,
                            goalId: project.goalId,
                          })
                        }
                        aria-label="Edit project"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archive">
                      <IconButton
                        size="small"
                        onClick={() => void projectRepository.remove(project.id)}
                        aria-label="Archive project"
                      >
                        <ArchiveOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{draft?.id ? "Edit project" : "New project"}</DialogTitle>
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
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={draft?.description ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, description: e.target.value } : d))
              }
            />
            <TextField
              select
              label="Status"
              value={draft?.status ?? "active"}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, status: e.target.value as ProjectStatus } : d,
                )
              }
            >
              {PROJECT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {PROJECT_STATUS_LABEL[status]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Linked goal"
              value={draft?.goalId ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, goalId: e.target.value || null } : d,
                )
              }
            >
              <MenuItem value="">None</MenuItem>
              {(goals ?? []).map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void save()}
            disabled={!draft?.title.trim()}
          >
            {draft?.id ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
