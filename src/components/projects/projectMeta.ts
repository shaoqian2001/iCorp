import type {
  ProjectStatus,
  ProjectType,
  SourceKind,
  SourceStatus,
} from "@/lib/data";

export const PROJECT_STATUSES: ProjectStatus[] = ["active", "done", "paused"];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  done: "Done",
  paused: "Paused",
};

export const PROJECT_STATUS_COLOR: Record<
  ProjectStatus,
  "primary" | "success" | "warning"
> = {
  active: "primary",
  done: "success",
  paused: "warning",
};

// --- Project types ----------------------------------------------------------

export const PROJECT_TYPES: ProjectType[] = ["personal", "business", "research"];

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  personal: "Personal",
  business: "Business",
  research: "Research",
};

export const PROJECT_TYPE_COLOR: Record<
  ProjectType,
  "default" | "info" | "secondary"
> = {
  personal: "default",
  business: "info",
  research: "secondary",
};

/** Optional type-specific checklist seeded when a project is created. */
export const STARTER_TASKS: Record<ProjectType, string[]> = {
  research: [
    "Define the research question",
    "Gather sources and references",
    "Literature review",
    "Synthesize findings",
    "Write up results",
  ],
  business: [
    "Define the value proposition",
    "Identify target customers",
    "Decide pricing",
    "Plan go-to-market",
    "Launch",
  ],
  personal: [
    "Clarify the outcome you want",
    "Break it into small steps",
    "Schedule time this week",
    "Review progress weekly",
  ],
};

// --- Sources (research reading list) ----------------------------------------

export const SOURCE_KINDS: SourceKind[] = [
  "paper",
  "article",
  "book",
  "dataset",
  "web",
  "other",
];

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  paper: "Paper",
  article: "Article",
  book: "Book",
  dataset: "Dataset",
  web: "Web",
  other: "Other",
};

export const SOURCE_STATUSES: SourceStatus[] = ["to_read", "reading", "read"];

export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  to_read: "To read",
  reading: "Reading",
  read: "Read",
};

export const SOURCE_STATUS_COLOR: Record<
  SourceStatus,
  "default" | "warning" | "success"
> = {
  to_read: "default",
  reading: "warning",
  read: "success",
};
