"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/data";

/**
 * Runs the idempotent first-run seed once on the client (IndexedDB only
 * exists in the browser). Renders nothing.
 */
export function DataBootstrap() {
  useEffect(() => {
    ensureSeeded().catch((error) => {
      console.error("Failed to seed the local database", error);
    });
  }, []);

  return null;
}
