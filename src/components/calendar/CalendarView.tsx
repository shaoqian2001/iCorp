"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  eventRepository,
  projectRepository,
  type CalendarEvent,
} from "@/lib/data";
import { listTimeZones, localTimeZone } from "@/lib/datetime/timeZones";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EventDraft {
  id?: string;
  title: string;
  allDay: boolean;
  date: string; // yyyy-MM-dd (wall date in `timeZone`)
  startTime: string; // HH:mm
  endTime: string; // HH:mm (optional)
  timeZone: string;
  notes: string;
  projectId: string | null;
}

function startInstant(draft: EventDraft): string {
  const time = draft.allDay ? "00:00" : draft.startTime || "00:00";
  return fromZonedTime(`${draft.date}T${time}:00`, draft.timeZone).toISOString();
}

function endInstant(draft: EventDraft): string | undefined {
  if (draft.allDay || !draft.endTime) return undefined;
  return fromZonedTime(
    `${draft.date}T${draft.endTime}:00`,
    draft.timeZone,
  ).toISOString();
}

export function CalendarView() {
  const events = useLiveQuery(() => eventRepository.list(), []);
  const projects = useLiveQuery(() => projectRepository.list(), []);

  const [displayTz, setDisplayTz] = useState(localTimeZone());
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const timeZones = useMemo(() => listTimeZones(), []);
  const projectName = (id: string | null) =>
    id ? (projects ?? []).find((p) => p.id === id)?.title : undefined;

  // Bucket events into yyyy-MM-dd day keys, evaluated in the display zone.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? []) {
      const key = formatInTimeZone(parseISO(event.start), displayTz, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.start.localeCompare(b.start);
      });
    }
    return map;
  }, [events, displayTz]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const timeLabel = (event: CalendarEvent) =>
    event.allDay
      ? "All day"
      : formatInTimeZone(parseISO(event.start), displayTz, "HH:mm");

  const openCreate = (dayKey: string) =>
    setDraft({
      title: "",
      allDay: false,
      date: dayKey,
      startTime: "09:00",
      endTime: "",
      timeZone: displayTz,
      notes: "",
      projectId: null,
    });

  const openEdit = (event: CalendarEvent) => {
    const tz = event.timeZone;
    setDraft({
      id: event.id,
      title: event.title,
      allDay: event.allDay,
      date: formatInTimeZone(parseISO(event.start), tz, "yyyy-MM-dd"),
      startTime: formatInTimeZone(parseISO(event.start), tz, "HH:mm"),
      endTime: event.end ? formatInTimeZone(parseISO(event.end), tz, "HH:mm") : "",
      timeZone: tz,
      notes: event.notes ?? "",
      projectId: event.projectId,
    });
  };

  const save = async () => {
    if (!draft || !draft.title.trim() || !draft.date) return;
    const payload = {
      title: draft.title.trim(),
      start: startInstant(draft),
      end: endInstant(draft),
      allDay: draft.allDay,
      timeZone: draft.timeZone,
      notes: draft.notes.trim() || undefined,
      projectId: draft.projectId,
    };
    if (draft.id) await eventRepository.update(draft.id, payload);
    else await eventRepository.create(payload);
    setDraft(null);
  };

  const selectedDayEvents = selectedDay
    ? eventsByDay.get(selectedDay) ?? []
    : [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary">
            Solo Studio
          </Typography>
          <Typography variant="h4" component="h1">
            Calendar
          </Typography>
          <Typography color="text.secondary">
            Times shown in your selected zone; each event keeps its own zone.
          </Typography>
        </Stack>
        <Autocomplete
          size="small"
          options={timeZones}
          value={displayTz}
          onChange={(_, value) => value && setDisplayTz(value)}
          disableClearable
          sx={{ minWidth: 260 }}
          renderInput={(params) => <TextField {...params} label="Display time zone" />}
        />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => setMonthCursor((m) => addMonths(m, -1))} aria-label="Previous month">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 180, textAlign: "center" }}>
          {format(monthCursor, "MMMM yyyy")}
        </Typography>
        <IconButton onClick={() => setMonthCursor((m) => addMonths(m, 1))} aria-label="Next month">
          <ChevronRightIcon />
        </IconButton>
        <Button size="small" onClick={() => setMonthCursor(startOfMonth(new Date()))}>
          Today
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCreate(format(new Date(), "yyyy-MM-dd"))}
        >
          New event
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {WEEKDAYS.map((day) => (
            <Box
              key={day}
              sx={{
                p: 1,
                textAlign: "center",
                borderBottom: 1,
                borderColor: "divider",
                fontWeight: 600,
                fontSize: 13,
                color: "text.secondary",
              }}
            >
              {day}
            </Box>
          ))}
          {gridDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(dayKey) ?? [];
            const inMonth = isSameMonth(day, monthCursor);
            return (
              <Box
                key={dayKey}
                onClick={() => setSelectedDay(dayKey)}
                sx={{
                  minHeight: { xs: 84, sm: 104 },
                  p: 0.75,
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  cursor: "pointer",
                  backgroundColor: inMonth ? "background.paper" : "action.hover",
                  opacity: inMonth ? 1 : 0.6,
                  "&:hover": { backgroundColor: "action.hover" },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    alignSelf: "flex-end",
                    fontWeight: isToday(day) ? 700 : 400,
                    color: isToday(day) ? "primary.main" : "text.secondary",
                  }}
                >
                  {format(day, "d")}
                </Typography>
                {dayEvents.slice(0, 3).map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      fontSize: 11,
                      lineHeight: 1.3,
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.allDay ? "" : `${timeLabel(event)} `}
                    {event.title}
                  </Box>
                ))}
                {dayEvents.length > 3 ? (
                  <Typography variant="caption" color="text.secondary">
                    +{dayEvents.length - 3} more
                  </Typography>
                ) : null}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Day panel */}
      <Dialog
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedDay
            ? format(parseISO(selectedDay), "EEEE, d MMMM yyyy")
            : ""}
        </DialogTitle>
        <DialogContent>
          {selectedDayEvents.length === 0 ? (
            <Typography color="text.secondary">No events this day.</Typography>
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {selectedDayEvents.map((event) => (
                <Stack key={event.id} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={600}>{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.allDay
                        ? "All day"
                        : `${formatInTimeZone(parseISO(event.start), displayTz, "HH:mm")}` +
                          (event.end
                            ? `–${formatInTimeZone(parseISO(event.end), displayTz, "HH:mm")}`
                            : "")}
                    </Typography>
                    {event.timeZone !== displayTz && !event.allDay ? (
                      <Typography variant="caption" color="text.secondary">
                        {formatInTimeZone(parseISO(event.start), event.timeZone, "HH:mm")} in{" "}
                        {event.timeZone}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      {projectName(event.projectId) ? (
                        <Chip size="small" variant="outlined" label={projectName(event.projectId)} />
                      ) : null}
                    </Stack>
                    {event.notes ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                        {event.notes}
                      </Typography>
                    ) : null}
                  </Box>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(event)} aria-label="Edit event">
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => void eventRepository.remove(event.id)}
                      aria-label="Delete event"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDay(null)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => selectedDay && openCreate(selectedDay)}
          >
            Add event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / edit event */}
      <Dialog open={draft !== null} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        <DialogTitle>{draft?.id ? "Edit event" : "New event"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              autoFocus
              value={draft?.title ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={draft?.allDay ?? false}
                  onChange={(e) => setDraft((d) => (d ? { ...d, allDay: e.target.checked } : d))}
                />
              }
              label="All day"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={draft?.date ?? ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, date: e.target.value } : d))}
              />
              {!draft?.allDay ? (
                <>
                  <TextField
                    label="Start"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={draft?.startTime ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, startTime: e.target.value } : d))}
                  />
                  <TextField
                    label="End"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={draft?.endTime ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, endTime: e.target.value } : d))}
                  />
                </>
              ) : null}
            </Stack>
            <Autocomplete
              options={timeZones}
              value={draft?.timeZone ?? displayTz}
              onChange={(_, value) =>
                setDraft((d) => (d && value ? { ...d, timeZone: value } : d))
              }
              disableClearable
              renderInput={(params) => <TextField {...params} label="Time zone" />}
            />
            <TextField
              select
              label="Project"
              value={draft?.projectId ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, projectId: e.target.value || null } : d))
              }
            >
              <MenuItem value="">None</MenuItem>
              {(projects ?? []).map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              fullWidth
              multiline
              minRows={2}
              value={draft?.notes ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, notes: e.target.value } : d))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void save()} disabled={!draft?.title.trim() || !draft?.date}>
            {draft?.id ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
