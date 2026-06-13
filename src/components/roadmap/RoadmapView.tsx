"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addMonths,
  eachMonthOfInterval,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  milestoneRepository,
  projectRepository,
  type MilestoneStatus,
} from "@/lib/data";

type Zoom = "quarter" | "half";

const LABEL_WIDTH = 150;

const STATUS_COLOR: Record<MilestoneStatus, "default" | "success" | "error"> = {
  planned: "default",
  hit: "success",
  missed: "error",
};

export function RoadmapView() {
  const milestones = useLiveQuery(() => milestoneRepository.list(), []);
  const projects = useLiveQuery(() => projectRepository.list(), []);
  const [zoom, setZoom] = useState<Zoom>("quarter");

  const loading = milestones === undefined || projects === undefined;

  const today = new Date();
  const months = zoom === "quarter" ? 3 : 6;
  const windowStart = startOfMonth(subMonths(today, 1));
  const windowEnd = addMonths(windowStart, months);
  const windowMs = windowEnd.getTime() - windowStart.getTime();
  const pct = (date: Date) =>
    ((date.getTime() - windowStart.getTime()) / windowMs) * 100;
  const monthTicks = eachMonthOfInterval({
    start: windowStart,
    end: subDays(windowEnd, 1),
  });

  const projectTitle = (projectId: string) =>
    (projects ?? []).find((p) => p.id === projectId)?.title ?? "Unknown project";

  // One row per project that has at least one milestone.
  const projectIds = [...new Set((milestones ?? []).map((m) => m.projectId))];
  const rows = projectIds
    .map((projectId) => ({
      projectId,
      title: projectTitle(projectId),
      milestones: (milestones ?? [])
        .filter((m) => m.projectId === projectId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-end" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary">
            Solo Studio
          </Typography>
          <Typography variant="h4" component="h1">
            Roadmap
          </Typography>
          <Typography color="text.secondary">
            Milestones on a timeline, grouped by project.
          </Typography>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={zoom}
          onChange={(_, next: Zoom | null) => {
            if (next) setZoom(next);
          }}
          aria-label="Timeline zoom"
        >
          <ToggleButton value="quarter">Quarter</ToggleButton>
          <ToggleButton value="half">Half-year</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No milestones yet. Add milestones to a project to see them here.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, overflowX: "auto" }}>
          <Box sx={{ minWidth: months * 170 + LABEL_WIDTH, position: "relative" }}>
            {/* Month axis */}
            <Box sx={{ display: "flex" }}>
              <Box sx={{ width: LABEL_WIDTH, flexShrink: 0 }} />
              <Box
                sx={{
                  position: "relative",
                  flexGrow: 1,
                  height: 28,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                {monthTicks.map((month) => (
                  <Typography
                    key={month.toISOString()}
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      position: "absolute",
                      left: `${pct(month)}%`,
                      pl: 0.5,
                      borderLeft: 1,
                      borderColor: "divider",
                      height: "100%",
                    }}
                  >
                    {format(month, month.getMonth() === 0 ? "MMM yy" : "MMM")}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Project rows */}
            {rows.map((row) => (
              <Box
                key={row.projectId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-of-type": { borderBottom: 0 },
                }}
              >
                <Box sx={{ width: LABEL_WIDTH, flexShrink: 0, pr: 2 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {row.title}
                  </Typography>
                </Box>
                <Box sx={{ position: "relative", flexGrow: 1, height: 60 }}>
                  {/* Today marker */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${pct(today)}%`,
                      top: 0,
                      bottom: 0,
                      width: "2px",
                      backgroundColor: "primary.main",
                      opacity: 0.35,
                    }}
                  />
                  {row.milestones
                    .filter((m) => {
                      const p = pct(parseISO(m.date));
                      return p >= 0 && p <= 100;
                    })
                    .map((m) => (
                      <Tooltip
                        key={m.id}
                        title={`${m.title} · ${format(parseISO(m.date), "d MMM yyyy")} · ${m.status}`}
                      >
                        <Chip
                          size="small"
                          color={STATUS_COLOR[m.status]}
                          variant={m.status === "planned" ? "outlined" : "filled"}
                          label={m.title}
                          sx={{
                            position: "absolute",
                            left: `${pct(parseISO(m.date))}%`,
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            maxWidth: 160,
                          }}
                        />
                      </Tooltip>
                    ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
