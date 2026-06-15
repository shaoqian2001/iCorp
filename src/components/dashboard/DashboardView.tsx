"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  goalRepository,
  milestoneRepository,
  projectRepository,
  taskRepository,
  type TaskStatus,
} from "@/lib/data";
import { ProjectsOverview } from "./ProjectsOverview";

const STATUS_COLOR: Record<TaskStatus, "default" | "info" | "success"> = {
  todo: "default",
  doing: "info",
  done: "success",
};

export function DashboardView() {
  const tasks = useLiveQuery(() => taskRepository.list(), []);
  const quarterGoals = useLiveQuery(
    () => goalRepository.listByHorizon("quarter"),
    [],
  );
  const milestones = useLiveQuery(() => milestoneRepository.list(), []);
  const projects = useLiveQuery(() => projectRepository.list(), []);

  const loading =
    tasks === undefined ||
    quarterGoals === undefined ||
    milestones === undefined ||
    projects === undefined;

  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");

  const projectName = new Map((projects ?? []).map((p) => [p.id, p.title]));
  const todaysTasks = (tasks ?? []).filter((t) => t.dueDate === todayIso);
  const activeQuarterGoals = (quarterGoals ?? []).filter(
    (g) => g.status === "active",
  );
  const nextMilestone = (milestones ?? [])
    .filter((m) => m.status === "planned" && m.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio · Dashboard
        </Typography>
        <Typography variant="h4" component="h1">
          Today at a glance
        </Typography>
        <Typography color="text.secondary">
          {format(today, "EEEE, d MMMM yyyy")}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <ProjectsOverview />
        </Box>

        <Card variant="outlined" sx={{ gridColumn: { md: "1 / -1" } }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today&apos;s tasks
            </Typography>
            {loading ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : todaysTasks.length === 0 ? (
              <Typography color="text.secondary">
                Nothing due today. Enjoy the breathing room, or pull something
                forward from the kanban.
              </Typography>
            ) : (
              <List disablePadding>
                {todaysTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    disableGutters
                    secondaryAction={
                      <Chip
                        size="small"
                        label={task.status}
                        color={STATUS_COLOR[task.status]}
                      />
                    }
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={
                        task.projectId
                          ? projectName.get(task.projectId)
                          : undefined
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active quarter goals
            </Typography>
            {loading ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : activeQuarterGoals.length === 0 ? (
              <Typography color="text.secondary">
                No active quarterly objectives yet.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {activeQuarterGoals.map((goal) => (
                  <Box key={goal.id}>
                    <Typography fontWeight={600}>{goal.title}</Typography>
                    {goal.targetMetric ? (
                      <Typography variant="body2" color="text.secondary">
                        {goal.targetMetric}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Next milestone
            </Typography>
            {loading ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : !nextMilestone ? (
              <Typography color="text.secondary">
                No upcoming milestones scheduled.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                <Typography fontWeight={600}>{nextMilestone.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {projectName.get(nextMilestone.projectId)}
                </Typography>
                <Chip
                  size="small"
                  sx={{ alignSelf: "flex-start", mt: 0.5 }}
                  label={format(parseISO(nextMilestone.date), "d MMM yyyy")}
                />
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
