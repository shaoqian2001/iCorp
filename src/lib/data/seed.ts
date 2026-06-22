import { addDays, addMonths, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { db } from "./dexie/db";
import {
  eventRepository,
  goalRepository,
  milestoneRepository,
  projectRepository,
  reviewRepository,
  sourceRepository,
  taskRepository,
} from "./index";
import type { TaskInput } from "./schemas";

/**
 * First-run seed data. It tells one coherent story — a freelancer building an
 * indie SaaS — and deliberately exercises every Demo v1 feature: a full
 * 3-level goal tree, projects linked to goals, past and future milestones,
 * tasks across all three kanban columns (some due today), and a couple of
 * weeks of review history. Dates are computed relative to "now" so the
 * dashboard and roadmap always look alive.
 */

const isoDate = (date: Date) => format(date, "yyyy-MM-dd");

/** True when no table holds any row (fresh browser profile). */
export async function isDatabaseEmpty(): Promise<boolean> {
  const counts = await Promise.all(db.tables.map((table) => table.count()));
  return counts.every((count) => count === 0);
}

export async function seedDatabase(): Promise<void> {
  const today = new Date();

  // --- Goals: north star -> long term -> quarter ---------------------------
  const northStar = await goalRepository.create({
    parentId: null,
    title: "Run a sustainable one-person software business",
    description: "Independence, meaningful work, and enough income to choose my projects.",
    horizon: "north_star",
    status: "active",
    sortOrder: 0,
  });

  const ltRevenue = await goalRepository.create({
    parentId: northStar.id,
    title: "Reach $10k in monthly recurring revenue",
    horizon: "long_term",
    status: "active",
    targetMetric: "$10k MRR within 3 years",
    sortOrder: 0,
  });
  const ltAudience = await goalRepository.create({
    parentId: northStar.id,
    title: "Build an audience of 10k engaged readers",
    horizon: "long_term",
    status: "active",
    targetMetric: "10k newsletter subscribers",
    sortOrder: 1,
  });

  const qLaunch = await goalRepository.create({
    parentId: ltRevenue.id,
    title: "Launch the MVP and land the first 50 paying users",
    horizon: "quarter",
    status: "active",
    targetMetric: "50 paying users",
    dueDate: isoDate(addMonths(today, 3)),
    sortOrder: 0,
  });
  const qPricing = await goalRepository.create({
    parentId: ltRevenue.id,
    title: "Validate pricing with 10 customer interviews",
    horizon: "quarter",
    status: "active",
    targetMetric: "10 interviews completed",
    sortOrder: 1,
  });
  const qContent = await goalRepository.create({
    parentId: ltAudience.id,
    title: "Publish 12 deep-dive articles this quarter",
    horizon: "quarter",
    status: "active",
    targetMetric: "12 articles",
    sortOrder: 2,
  });

  // --- Projects linked to quarter goals ------------------------------------
  const pMvp = await projectRepository.create({
    goalId: qLaunch.id,
    title: "MVP Launch",
    description: "Ship the first public version and onboard early users.",
    status: "active",
    type: "business",
  });
  const pResearch = await projectRepository.create({
    goalId: qPricing.id,
    title: "Customer & Pricing Research",
    description: "Talk to users, review the literature, understand willingness to pay.",
    status: "active",
    type: "research",
  });
  const pContent = await projectRepository.create({
    goalId: qContent.id,
    title: "Content Engine",
    description: "A repeatable pipeline for publishing technical articles.",
    status: "active",
    type: "personal",
  });

  // Research sources for the research project (reading list / references).
  await Promise.all([
    sourceRepository.create({
      projectId: pResearch.id,
      title: "The Mom Test",
      authors: "Rob Fitzpatrick",
      kind: "book",
      status: "reading",
      notes: "How to talk to customers without biasing the answers.",
    }),
    sourceRepository.create({
      projectId: pResearch.id,
      title: "Jobs to be Done: a framework for customer needs",
      url: "https://hbr.org/2016/09/know-your-customers-jobs-to-be-done",
      kind: "article",
      status: "read",
    }),
    sourceRepository.create({
      projectId: pResearch.id,
      title: "Van Westendorp price sensitivity meter",
      kind: "paper",
      status: "to_read",
      notes: "Method for finding an acceptable price range.",
    }),
  ]);

  // --- Milestones: a mix of hit (past) and planned (future) ----------------
  await Promise.all([
    milestoneRepository.create({
      projectId: pMvp.id,
      title: "Private beta opened",
      date: isoDate(subDays(today, 21)),
      status: "hit",
    }),
    milestoneRepository.create({
      projectId: pMvp.id,
      title: "Public launch",
      date: isoDate(addDays(today, 14)),
      status: "planned",
    }),
    milestoneRepository.create({
      projectId: pMvp.id,
      title: "First 50 paying users",
      date: isoDate(addMonths(today, 2)),
      status: "planned",
    }),
    milestoneRepository.create({
      projectId: pResearch.id,
      title: "10 interviews booked",
      date: isoDate(addDays(today, 7)),
      status: "planned",
    }),
    milestoneRepository.create({
      projectId: pContent.id,
      title: "Editorial calendar locked",
      date: isoDate(subDays(today, 10)),
      status: "hit",
    }),
    milestoneRepository.create({
      projectId: pContent.id,
      title: "6 articles published",
      date: isoDate(addMonths(today, 1)),
      status: "planned",
    }),
  ]);

  // --- Tasks: spread across todo / doing / done, some due today ------------
  const tasks: TaskInput[] = [
    {
      projectId: pMvp.id,
      title: "Fix the onboarding redirect bug",
      status: "doing",
      dueDate: isoDate(today),
      sortOrder: 0,
    },
    {
      projectId: pMvp.id,
      title: "Write the launch announcement",
      status: "todo",
      dueDate: isoDate(addDays(today, 2)),
      sortOrder: 1,
    },
    {
      projectId: pMvp.id,
      title: "Set up error monitoring",
      status: "todo",
      sortOrder: 2,
    },
    {
      projectId: pMvp.id,
      title: "Wire up product analytics",
      status: "done",
      sortOrder: 3,
    },
    {
      projectId: pContent.id,
      title: "Draft 'Why local-first apps win' article",
      status: "doing",
      dueDate: isoDate(today),
      sortOrder: 0,
    },
    {
      projectId: pContent.id,
      title: "Outline the next three posts",
      status: "todo",
      sortOrder: 1,
    },
    {
      projectId: pResearch.id,
      title: "Email 5 beta users to book calls",
      status: "todo",
      dueDate: isoDate(addDays(today, 1)),
      sortOrder: 0,
    },
    {
      goalId: qPricing.id,
      title: "Review competitor pricing pages",
      status: "done",
      sortOrder: 1,
    },
  ];
  await Promise.all(tasks.map((task) => taskRepository.create(task)));

  // --- Weekly reviews: the last two weeks ----------------------------------
  const lastMonday = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  const twoWeeksAgoMonday = startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 });
  await Promise.all([
    reviewRepository.create({
      weekStart: isoDate(twoWeeksAgoMonday),
      wins: "Opened the private beta and got 8 sign-ups.",
      blockers: "Onboarding drop-off was higher than expected.",
      lessons: "Users need a sample workspace before they commit.",
      nextFocus: "Tighten the first-run experience.",
    }),
    reviewRepository.create({
      weekStart: isoDate(lastMonday),
      wins: "Shipped seed data and a guided empty state.",
      blockers: "Spread too thin across content and product.",
      lessons: "Batch similar work; protect deep-work mornings.",
      nextFocus: "Public launch prep and 3 customer interviews.",
    }),
  ]);

  // --- Calendar events across time zones -----------------------------------
  // Wall-time in a zone -> absolute UTC instant for storage.
  const at = (daysAhead: number, time: string, tz: string) =>
    fromZonedTime(`${isoDate(addDays(today, daysAhead))}T${time}:00`, tz).toISOString();
  await Promise.all([
    eventRepository.create({
      title: "Customer interview — Acme",
      start: at(2, "15:00", "America/New_York"),
      end: at(2, "15:45", "America/New_York"),
      timeZone: "America/New_York",
      projectId: pResearch.id,
      notes: "Pricing and jobs-to-be-done.",
    }),
    eventRepository.create({
      title: "Public launch go-live",
      start: at(14, "09:00", "Europe/London"),
      timeZone: "Europe/London",
      projectId: pMvp.id,
    }),
    eventRepository.create({
      title: "Deep work — writing block",
      start: at(1, "08:00", "Asia/Singapore"),
      end: at(1, "10:00", "Asia/Singapore"),
      timeZone: "Asia/Singapore",
      projectId: pContent.id,
    }),
  ]);
}

/** Seed only if the database is empty. Returns whether seeding happened. */
export async function ensureSeeded(): Promise<boolean> {
  if (!(await isDatabaseEmpty())) return false;
  await seedDatabase();
  return true;
}

/** Wipe every table and re-seed (powers "reset & reseed" in settings). */
export async function resetAndReseed(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
  await seedDatabase();
}
