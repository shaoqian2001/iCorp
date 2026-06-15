"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { goalRepository, type Goal, type GoalStatus } from "@/lib/data";
import { CHILD_HORIZON, type GoalTreeController } from "./goalMeta";
import { GoalNode } from "./GoalNode";

export function GoalsView() {
  const goals = useLiveQuery(() => goalRepository.list(), []);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [didInitExpand, setDidInitExpand] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [addingRoot, setAddingRoot] = useState(false);
  const [rootDraft, setRootDraft] = useState("");

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Goal[]>();
    for (const goal of goals ?? []) {
      const siblings = map.get(goal.parentId) ?? [];
      siblings.push(goal);
      map.set(goal.parentId, siblings);
    }
    for (const siblings of map.values()) {
      siblings.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
    }
    return map;
  }, [goals]);

  // Expand the whole tree the first time it loads.
  useEffect(() => {
    if (goals && !didInitExpand) {
      setExpanded(new Set(goals.map((goal) => goal.id)));
      setDidInitExpand(true);
    }
  }, [goals, didInitExpand]);

  const roots = childrenByParent.get(null) ?? [];
  const northStar = roots.find((goal) => goal.horizon === "north_star");

  const controller: GoalTreeController = {
    childrenOf: (parentId) => childrenByParent.get(parentId) ?? [],
    isExpanded: (id) => expanded.has(id),
    toggleExpanded: (id) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    expand: (id) => setExpanded((prev) => new Set(prev).add(id)),
    editingId,
    setEditingId,
    addingParentId,
    setAddingParentId,
    createChild: async (parent, title) => {
      const horizon = CHILD_HORIZON[parent.horizon];
      if (!horizon) return;
      const siblings = childrenByParent.get(parent.id) ?? [];
      const created = await goalRepository.create({
        parentId: parent.id,
        title,
        horizon,
        status: "active",
        sortOrder: siblings.length,
      });
      setExpanded((prev) => new Set(prev).add(created.id));
    },
    rename: async (goal, title) => {
      await goalRepository.update(goal.id, { title });
    },
    setStatus: async (goal, status: GoalStatus) => {
      await goalRepository.update(goal.id, { status });
    },
    archive: async (goal) => {
      // Cascade: archiving a goal soft-deletes its descendants too, so the
      // tree never shows orphaned children.
      const ids: string[] = [];
      const collect = (id: string) => {
        ids.push(id);
        for (const child of childrenByParent.get(id) ?? []) collect(child.id);
      };
      collect(goal.id);
      for (const id of ids) await goalRepository.remove(id);
    },
  };

  const saveRoot = async () => {
    const title = rootDraft.trim();
    if (!title) return;
    const created = await goalRepository.create({
      parentId: null,
      title,
      horizon: "north_star",
      status: "active",
      sortOrder: 0,
    });
    setExpanded((prev) => new Set(prev).add(created.id));
    setRootDraft("");
    setAddingRoot(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio
        </Typography>
        <Typography variant="h4" component="h1">
          Goals
        </Typography>
        <Typography color="text.secondary">
          Your north star, the long-term goals beneath it, and this
          quarter&apos;s objectives.
        </Typography>
      </Stack>

      {goals === undefined ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : !northStar ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ mb: 2 }}>
            Start with your north star — the one outcome everything else ladders
            up to.
          </Typography>
          {addingRoot ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <TextField
                size="small"
                autoFocus
                placeholder="Your north star goal"
                value={rootDraft}
                onChange={(e) => setRootDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveRoot();
                  if (e.key === "Escape") setAddingRoot(false);
                }}
                sx={{ maxWidth: 360, width: "100%" }}
              />
              <IconButton
                color="primary"
                onClick={() => void saveRoot()}
                disabled={!rootDraft.trim()}
                aria-label="Add north star"
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                onClick={() => setAddingRoot(false)}
                aria-label="Cancel"
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddingRoot(true)}
            >
              Add north star
            </Button>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
          {roots.map((root) => (
            <GoalNode
              key={root.id}
              goal={root}
              depth={0}
              controller={controller}
            />
          ))}
        </Paper>
      )}
    </Container>
  );
}
