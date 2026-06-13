"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  goalRepository,
  projectRepository,
  taskRepository,
  type Task,
  type TaskStatus,
} from "@/lib/data";
import { TASK_COLUMNS } from "./taskMeta";

interface TaskCardProps {
  task: Task;
  contextLabel?: string;
  isEditing: boolean;
  canMovePrev: boolean;
  canMoveNext: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (title: string) => void;
  onMove: (direction: -1 | 1) => void;
  onArchive: () => void;
}

function TaskCard({
  task,
  contextLabel,
  isEditing,
  canMovePrev,
  canMoveNext,
  onStartEdit,
  onCancelEdit,
  onRename,
  onMove,
  onArchive,
}: TaskCardProps) {
  const [draft, setDraft] = useState(task.title);

  useEffect(() => {
    if (isEditing) setDraft(task.title);
  }, [isEditing, task.title]);

  const overdue =
    task.dueDate !== undefined &&
    task.status !== "done" &&
    isBefore(parseISO(task.dueDate), startOfDay(new Date()));

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {isEditing ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <TextField
              size="small"
              fullWidth
              autoFocus
              multiline
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim()) onRename(draft.trim());
                }
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <IconButton
              size="small"
              color="primary"
              disabled={!draft.trim()}
              onClick={() => onRename(draft.trim())}
              aria-label="Save"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onCancelEdit} aria-label="Cancel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2">{task.title}</Typography>
            {(contextLabel || task.dueDate) && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {contextLabel ? (
                  <Chip size="small" variant="outlined" label={contextLabel} />
                ) : null}
                {task.dueDate ? (
                  <Chip
                    size="small"
                    color={overdue ? "warning" : "default"}
                    label={format(parseISO(task.dueDate), "d MMM")}
                  />
                ) : null}
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row">
                <Tooltip title="Move left">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!canMovePrev}
                      onClick={() => onMove(-1)}
                      aria-label="Move to previous column"
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move right">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!canMoveNext}
                      onClick={() => onMove(1)}
                      aria-label="Move to next column"
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Stack direction="row">
                <Tooltip title="Rename">
                  <IconButton size="small" onClick={onStartEdit} aria-label="Rename task">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Archive">
                  <IconButton size="small" onClick={onArchive} aria-label="Archive task">
                    <ArchiveOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function TasksBoard() {
  const tasks = useLiveQuery(() => taskRepository.list(), []);
  const projects = useLiveQuery(() => projectRepository.list(), []);
  const goals = useLiveQuery(() => goalRepository.list(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);
  const [addDraft, setAddDraft] = useState("");

  const loading =
    tasks === undefined || projects === undefined || goals === undefined;

  const contextLabel = (task: Task): string | undefined => {
    if (task.projectId) {
      return (projects ?? []).find((p) => p.id === task.projectId)?.title;
    }
    if (task.goalId) {
      return (goals ?? []).find((g) => g.id === task.goalId)?.title;
    }
    return undefined;
  };

  const tasksIn = (status: TaskStatus) =>
    (tasks ?? [])
      .filter((task) => task.status === status)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );

  const addTask = async (status: TaskStatus) => {
    const title = addDraft.trim();
    if (!title) return;
    const count = (tasks ?? []).filter((task) => task.status === status).length;
    await taskRepository.create({ title, status, sortOrder: count });
    setAddDraft("");
    setAddingStatus(null);
  };

  const moveTask = async (task: Task, direction: -1 | 1) => {
    const index = TASK_COLUMNS.findIndex((c) => c.status === task.status);
    const target = TASK_COLUMNS[index + direction];
    if (!target) return;
    const count = (tasks ?? []).filter((t) => t.status === target.status).length;
    await taskRepository.update(task.id, {
      status: target.status,
      sortOrder: count,
    });
  };

  const renameTask = async (task: Task, title: string) => {
    await taskRepository.update(task.id, { title });
    setEditingId(null);
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio
        </Typography>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Typography color="text.secondary">
          Move work across to do, doing, and done.
        </Typography>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            alignItems: "start",
          }}
        >
          {TASK_COLUMNS.map(({ status, label }, columnIndex) => {
            const columnTasks = tasksIn(status);
            return (
              <Paper
                key={status}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  backgroundColor: "background.default",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {label}
                    </Typography>
                    <Chip size="small" label={columnTasks.length} />
                  </Stack>
                  <Tooltip title={`Add to ${label.toLowerCase()}`}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setAddDraft("");
                        setAddingStatus(status);
                      }}
                      aria-label={`Add task to ${label}`}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {addingStatus === status && (
                  <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <TextField
                      size="small"
                      fullWidth
                      autoFocus
                      multiline
                      placeholder="New task"
                      value={addDraft}
                      onChange={(e) => setAddDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void addTask(status);
                        }
                        if (e.key === "Escape") setAddingStatus(null);
                      }}
                    />
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={!addDraft.trim()}
                      onClick={() => void addTask(status)}
                      aria-label="Add task"
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setAddingStatus(null)}
                      aria-label="Cancel"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}

                {columnTasks.length === 0 && addingStatus !== status ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: "center" }}
                  >
                    Nothing here yet.
                  </Typography>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      contextLabel={contextLabel(task)}
                      isEditing={editingId === task.id}
                      canMovePrev={columnIndex > 0}
                      canMoveNext={columnIndex < TASK_COLUMNS.length - 1}
                      onStartEdit={() => setEditingId(task.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onRename={(title) => void renameTask(task, title)}
                      onMove={(direction) => void moveTask(task, direction)}
                      onArchive={() => void taskRepository.remove(task.id)}
                    />
                  ))
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
