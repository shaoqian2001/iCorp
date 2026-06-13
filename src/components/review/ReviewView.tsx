"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { reviewRepository, type ReviewEntry } from "@/lib/data";

interface ReviewForm {
  wins: string;
  blockers: string;
  lessons: string;
  nextFocus: string;
}

const EMPTY_FORM: ReviewForm = {
  wins: "",
  blockers: "",
  lessons: "",
  nextFocus: "",
};

const STEPS: { key: keyof ReviewForm; label: string; prompt: string }[] = [
  { key: "wins", label: "Wins", prompt: "What went well this week?" },
  { key: "blockers", label: "Blockers", prompt: "What got in the way?" },
  { key: "lessons", label: "Lessons", prompt: "What did you learn?" },
  {
    key: "nextFocus",
    label: "Next focus",
    prompt: "What's the one focus for next week?",
  },
];

const weekLabel = (weekStart: string) => {
  const start = parseISO(weekStart);
  return `${format(start, "d MMM")} – ${format(addDays(start, 6), "d MMM yyyy")}`;
};

const preview = (text: string) =>
  text.trim() ? text.trim().slice(0, 48) + (text.length > 48 ? "…" : "") : "";

export function ReviewView() {
  const entries = useLiveQuery(() => reviewRepository.list(), []);

  const currentWeek = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const existing = (entries ?? []).find((e) => e.weekStart === currentWeek);

  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [activeStep, setActiveStep] = useState(0);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);

  // Hydrate the form once from this week's saved entry (if any).
  useEffect(() => {
    if (entries === undefined || loadedFor === currentWeek) return;
    setForm(
      existing
        ? {
            wins: existing.wins,
            blockers: existing.blockers,
            lessons: existing.lessons,
            nextFocus: existing.nextFocus,
          }
        : EMPTY_FORM,
    );
    setLoadedFor(currentWeek);
  }, [entries, existing, currentWeek, loadedFor]);

  const setField = (key: keyof ReviewForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (existing) {
      await reviewRepository.update(existing.id, form);
    } else {
      await reviewRepository.create({ weekStart: currentWeek, ...form });
    }
    setSavedOpen(true);
  };

  const past = (entries ?? [])
    .filter((e) => e.weekStart !== currentWeek)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, maxWidth: 760, mx: "auto" }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio
        </Typography>
        <Typography variant="h4" component="h1">
          Weekly review
        </Typography>
        <Typography color="text.secondary">
          A guided check-in for {weekLabel(currentWeek)}.
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {existing ? "Continue this week's review" : "Start this week's review"}
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
            {STEPS.map((step, index) => (
              <Step key={step.key} completed={false}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  optional={
                    preview(form[step.key]) ? (
                      <Typography variant="caption" color="text.secondary">
                        {preview(form[step.key])}
                      </Typography>
                    ) : undefined
                  }
                  sx={{ cursor: "pointer" }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                    {step.prompt}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={form[step.key]}
                    onChange={(e) => setField(step.key, e.target.value)}
                    autoFocus
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {index > 0 && (
                      <Button onClick={() => setActiveStep((s) => s - 1)}>
                        Back
                      </Button>
                    )}
                    {index < STEPS.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep((s) => s + 1)}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button variant="contained" onClick={() => void save()}>
                        Save review
                      </Button>
                    )}
                  </Stack>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Past reviews
      </Typography>
      {entries === undefined ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : past.length === 0 ? (
        <Typography color="text.secondary">
          No past reviews yet. Once you save reviews for earlier weeks, they
          show up here.
        </Typography>
      ) : (
        past.map((entry) => (
          <Accordion key={entry.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{weekLabel(entry.weekStart)}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ReviewSummary entry={entry} />
            </AccordionDetails>
          </Accordion>
        ))
      )}

      <Snackbar
        open={savedOpen}
        autoHideDuration={3000}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSavedOpen(false)}>
          Review saved
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ReviewSummary({ entry }: { entry: ReviewEntry }) {
  const sections: { label: string; value: string }[] = [
    { label: "Wins", value: entry.wins },
    { label: "Blockers", value: entry.blockers },
    { label: "Lessons", value: entry.lessons },
    { label: "Next focus", value: entry.nextFocus },
  ];
  return (
    <Stack spacing={1.5}>
      {sections.map((section) => (
        <Box key={section.label}>
          <Typography variant="subtitle2">{section.label}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {section.value.trim() || "—"}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
