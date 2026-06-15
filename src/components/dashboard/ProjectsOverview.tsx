"use client";

import { useLiveQuery } from "dexie-react-hooks";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  projectRepository,
  taskRepository,
  type TaskStatus,
} from "@/lib/data";

const SEGMENTS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To do", color: "grey.400" },
  { status: "doing", label: "Doing", color: "info.main" },
  { status: "done", label: "Done", color: "success.main" },
];

export function ProjectsOverview() {
  const projects = useLiveQuery(() => projectRepository.list(), []);
  const tasks = useLiveQuery(() => taskRepository.list(), []);

  const loading = projects === undefined || tasks === undefined;

  const rows = (projects ?? [])
    .filter((project) => project.status === "active")
    .map((project) => {
      const counts: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
      for (const task of tasks ?? []) {
        if (task.projectId === project.id) counts[task.status] += 1;
      }
      const total = counts.todo + counts.doing + counts.done;
      return { id: project.id, title: project.title, counts, total };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="h6">Projects overview</Typography>
          <Button size="small" component={NextLink} href="/projects">
            All projects
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {SEGMENTS.map((segment) => (
            <Stack
              key={segment.status}
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.5,
                  backgroundColor: segment.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {segment.label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary">
            No active projects yet. Create one to see it here.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {rows.map((row) => (
              <Box key={row.id}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {row.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.total === 0
                      ? "No tasks"
                      : `${row.counts.done}/${row.total} done`}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: "flex",
                    height: 10,
                    borderRadius: 5,
                    overflow: "hidden",
                    backgroundColor: "action.hover",
                  }}
                >
                  {SEGMENTS.map((segment) => {
                    const value = row.counts[segment.status];
                    if (value === 0) return null;
                    return (
                      <Tooltip
                        key={segment.status}
                        title={`${segment.label}: ${value}`}
                      >
                        <Box
                          sx={{
                            width: `${(value / row.total) * 100}%`,
                            backgroundColor: segment.color,
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
