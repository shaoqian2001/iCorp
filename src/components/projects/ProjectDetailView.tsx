"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import NextLink from "next/link";
import { format, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  goalRepository,
  milestoneRepository,
  projectRepository,
  taskRepository,
  type MilestoneStatus,
  type ProjectStatus,
  type TaskStatus,
} from "@/lib/data";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "./projectMeta";
import { TASK_COLUMNS } from "@/components/tasks/taskMeta";

const MILESTONE_STATUSES: MilestoneStatus[] = ["planned", "hit", "missed"];
const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  planned: "Planned",
  hit: "Hit",
  missed: "Missed",
};

export function ProjectDetailView({ id }: { id: string }) {
  const project = useLiveQuery(
    async () => (await projectRepository.get(id)) ?? null,
    [id],
  );
  const tasks = useLiveQuery(() => taskRepository.listByProject(id), [id]);
  const milestones = useLiveQuery(
    () => milestoneRepository.listByProject(id),
    [id],
  );
  const goals = useLiveQuery(() => goalRepository.list(), []);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");

  if (project === undefined) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">Loading…</Typography>
      </Container>
    );
  }

  if (project === null) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Button
          component={NextLink}
          href="/projects"
          startIcon={<ArrowBackIcon />}
        >
          Projects
        </Button>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Project not found
        </Typography>
      </Container>
    );
  }

  const tasksByStatus = (status: TaskStatus) =>
    (tasks ?? [])
      .filter((task) => task.status === status)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
  const orderedMilestones = (milestones ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const saveTitle = async () => {
    if (!titleDraft.trim()) return;
    await projectRepository.update(project.id, { title: titleDraft.trim() });
    setEditingTitle(false);
  };
  const addTask = async () => {
    if (!taskTitle.trim()) return;
    const count = (tasks ?? []).filter((t) => t.status === taskStatus).length;
    await taskRepository.create({
      projectId: project.id,
      title: taskTitle.trim(),
      status: taskStatus,
      sortOrder: count,
    });
    setTaskTitle("");
  };
  const addMilestone = async () => {
    if (!milestoneTitle.trim() || !milestoneDate) return;
    await milestoneRepository.create({
      projectId: project.id,
      title: milestoneTitle.trim(),
      date: milestoneDate,
      status: "planned",
    });
    setMilestoneTitle("");
    setMilestoneDate("");
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Button
        component={NextLink}
        href="/projects"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Projects
      </Button>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {editingTitle ? (
          <>
            <TextField
              size="small"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
            />
            <IconButton
              size="small"
              color="primary"
              onClick={() => void saveTitle()}
              disabled={!titleDraft.trim()}
              aria-label="Save"
            >
              <CheckIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setEditingTitle(false)}
              aria-label="Cancel"
            >
              <CloseIcon />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1">
              {project.title}
            </Typography>
            <Tooltip title="Rename">
              <IconButton
                size="small"
                onClick={() => {
                  setTitleDraft(project.title);
                  setEditingTitle(true);
                }}
                aria-label="Rename project"
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>

      {project.description ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={project.status}
          onChange={(e) =>
            void projectRepository.update(project.id, {
              status: e.target.value as ProjectStatus,
            })
          }
          sx={{ minWidth: 160 }}
        >
          {PROJECT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {PROJECT_STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Linked goal"
          value={project.goalId ?? ""}
          onChange={(e) =>
            void projectRepository.update(project.id, {
              goalId: e.target.value || null,
            })
          }
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">None</MenuItem>
          {(goals ?? []).map((goal) => (
            <MenuItem key={goal.id} value={goal.id}>
              {goal.title}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Typography variant="h6" gutterBottom>
        Roadmap &amp; milestones
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: orderedMilestones.length ? 2 : 0 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="New milestone"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            value={milestoneDate}
            onChange={(e) => setMilestoneDate(e.target.value)}
            sx={{ minWidth: 170 }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => void addMilestone()}
            disabled={!milestoneTitle.trim() || !milestoneDate}
          >
            Add
          </Button>
        </Stack>
        {orderedMilestones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No milestones yet.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={1}>
            {orderedMilestones.map((milestone) => (
              <Stack
                key={milestone.id}
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <Typography sx={{ flexGrow: 1 }} noWrap>
                  {milestone.title}
                </Typography>
                <Chip
                  size="small"
                  label={format(parseISO(milestone.date), "d MMM yyyy")}
                />
                <TextField
                  select
                  size="small"
                  value={milestone.status}
                  onChange={(e) =>
                    void milestoneRepository.update(milestone.id, {
                      status: e.target.value as MilestoneStatus,
                    })
                  }
                  sx={{ minWidth: 120 }}
                >
                  {MILESTONE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {MILESTONE_STATUS_LABEL[status]}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  size="small"
                  onClick={() => void milestoneRepository.remove(milestone.id)}
                  aria-label="Delete milestone"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Tasks
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="New task"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addTask();
            }}
          />
          <TextField
            select
            size="small"
            value={taskStatus}
            onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
            sx={{ minWidth: 130 }}
          >
            {TASK_COLUMNS.map((column) => (
              <MenuItem key={column.status} value={column.status}>
                {column.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => void addTask()}
            disabled={!taskTitle.trim()}
          >
            Add
          </Button>
        </Stack>
        {(tasks ?? []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tasks yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {TASK_COLUMNS.map((column) => {
              const list = tasksByStatus(column.status);
              if (list.length === 0) return null;
              return (
                <Box key={column.status}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {column.label} · {list.length}
                  </Typography>
                  <Stack divider={<Divider />} spacing={1}>
                    {list.map((task) => (
                      <Stack
                        key={task.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography sx={{ flexGrow: 1 }} noWrap>
                          {task.title}
                        </Typography>
                        {task.dueDate ? (
                          <Chip
                            size="small"
                            label={format(parseISO(task.dueDate), "d MMM")}
                          />
                        ) : null}
                        <TextField
                          select
                          size="small"
                          value={task.status}
                          onChange={(e) =>
                            void taskRepository.update(task.id, {
                              status: e.target.value as TaskStatus,
                            })
                          }
                          sx={{ minWidth: 110 }}
                        >
                          {TASK_COLUMNS.map((c) => (
                            <MenuItem key={c.status} value={c.status}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <IconButton
                          size="small"
                          onClick={() => void taskRepository.remove(task.id)}
                          aria-label="Archive task"
                        >
                          <ArchiveOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
