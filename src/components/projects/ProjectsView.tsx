"use client";

import { useState, type ReactElement } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import {
  goalRepository,
  milestoneRepository,
  projectRepository,
  taskRepository,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/data";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  PROJECT_TYPES,
  PROJECT_TYPE_COLOR,
  PROJECT_TYPE_LABEL,
  STARTER_TASKS,
} from "./projectMeta";

interface Draft {
  id?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  type: ProjectType;
  goalId: string | null;
  starterTasks: boolean;
}

const NEW_DRAFT: Draft = {
  title: "",
  description: "",
  status: "active",
  type: "personal",
  goalId: null,
  starterTasks: false,
};

export function typeIcon(type: ProjectType): ReactElement {
  if (type === "research") return <ScienceOutlinedIcon fontSize="small" />;
  if (type === "business") return <BusinessCenterOutlinedIcon fontSize="small" />;
  return <PersonOutlineIcon fontSize="small" />;
}

export function ProjectsView() {
  const projects = useLiveQuery(() => projectRepository.list(), []);
  const tasks = useLiveQuery(() => taskRepository.list(), []);
  const milestones = useLiveQuery(() => milestoneRepository.list(), []);
  const goals = useLiveQuery(() => goalRepository.list(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");

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
      type: draft.type,
      goalId: draft.goalId,
    };
    if (draft.id) {
      await projectRepository.update(draft.id, payload);
    } else {
      const created = await projectRepository.create(payload);
      if (draft.starterTasks) {
        await Promise.all(
          STARTER_TASKS[draft.type].map((title, index) =>
            taskRepository.create({
              projectId: created.id,
              title,
              status: "todo",
              sortOrder: index,
            }),
          ),
        );
      }
    }
    setDraft(null);
  };

  const ordered = (projects ?? [])
    .slice()
    .filter((p) => typeFilter === "all" || p.type === typeFilter)
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 3 }}
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft({ ...NEW_DRAFT })}>
          New project
        </Button>
      </Stack>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={typeFilter}
        onChange={(_, next: ProjectType | "all" | null) => {
          if (next) setTypeFilter(next);
        }}
        sx={{ mb: 3 }}
        aria-label="Filter by project type"
      >
        <ToggleButton value="all">All</ToggleButton>
        {PROJECT_TYPES.map((type) => (
          <ToggleButton key={type} value={type}>
            {PROJECT_TYPE_LABEL[type]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {projects === undefined ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : ordered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ mb: 2 }}>
            {typeFilter === "all"
              ? "No projects yet. Create one to start organizing your work."
              : `No ${PROJECT_TYPE_LABEL[typeFilter].toLowerCase()} projects yet.`}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft({ ...NEW_DRAFT })}>
            Create a project
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
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {project.description}
                    </Typography>
                  ) : null}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <Chip
                      size="small"
                      icon={typeIcon(project.type)}
                      label={PROJECT_TYPE_LABEL[project.type]}
                      color={PROJECT_TYPE_COLOR[project.type]}
                      variant="outlined"
                    />
                    {goalTitle(project.goalId) ? (
                      <Chip size="small" variant="outlined" label={`Goal: ${goalTitle(project.goalId)}`} />
                    ) : null}
                    <Chip size="small" variant="outlined" label={`${stats.done}/${stats.total} tasks`} />
                    <Chip size="small" variant="outlined" label={`${milestoneCount(project.id)} milestones`} />
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 1 }}>
                    <Button size="small" component={NextLink} href={`/projects/${project.id}`}>
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
                            type: project.type,
                            goalId: project.goalId,
                            starterTasks: false,
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

      <Dialog open={draft !== null} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        <DialogTitle>{draft?.id ? "Edit project" : "New project"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              autoFocus
              value={draft?.title ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={draft?.description ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Type"
                fullWidth
                value={draft?.type ?? "personal"}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, type: e.target.value as ProjectType } : d))
                }
              >
                {PROJECT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {PROJECT_TYPE_LABEL[type]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                fullWidth
                value={draft?.status ?? "active"}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, status: e.target.value as ProjectStatus } : d))
                }
              >
                {PROJECT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {PROJECT_STATUS_LABEL[status]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              select
              label="Linked goal"
              value={draft?.goalId ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, goalId: e.target.value || null } : d))}
            >
              <MenuItem value="">None</MenuItem>
              {(goals ?? []).map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
            </TextField>
            {draft && !draft.id ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={draft.starterTasks}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, starterTasks: e.target.checked } : d))
                    }
                  />
                }
                label={`Add starter tasks for a ${PROJECT_TYPE_LABEL[draft.type].toLowerCase()} project`}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void save()} disabled={!draft?.title.trim()}>
            {draft?.id ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
