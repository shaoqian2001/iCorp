"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  eventRepository,
  goalRepository,
  milestoneRepository,
  projectRepository,
  reviewRepository,
  sourceRepository,
  taskRepository,
} from "@/lib/data";
import { backupToCloud } from "@/lib/cloud/sync";
import { getAutoBackup } from "@/lib/cloud/prefs";

const DEBOUNCE_MS = 8000;

/**
 * When signed in and auto-backup is enabled, pushes the workspace to the cloud
 * a few seconds after any local change. Opt-in; renders nothing.
 */
export function CloudAutoBackup() {
  const { status } = useSession();

  // A cheap change signal: total active record count + latest updatedAt.
  const revision = useLiveQuery(async () => {
    const lists = await Promise.all([
      goalRepository.list(),
      projectRepository.list(),
      taskRepository.list(),
      milestoneRepository.list(),
      reviewRepository.list(),
      sourceRepository.list(),
      eventRepository.list(),
    ]);
    let count = 0;
    let latest = "";
    for (const list of lists) {
      count += list.length;
      for (const row of list) if (row.updatedAt > latest) latest = row.updatedAt;
    }
    return `${count}:${latest}`;
  }, []);

  const backedUpRevision = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || revision === undefined) return;
    if (!getAutoBackup()) return;
    // Prime on the first observed revision; only back up on later changes.
    if (backedUpRevision.current === null) {
      backedUpRevision.current = revision;
      return;
    }
    if (backedUpRevision.current === revision) return;

    if (timer.current) clearTimeout(timer.current);
    const target = revision;
    timer.current = setTimeout(() => {
      backupToCloud()
        .then(() => {
          backedUpRevision.current = target;
        })
        .catch(() => {
          /* transient — the Settings panel surfaces manual-backup errors */
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [revision, status]);

  return null;
}
