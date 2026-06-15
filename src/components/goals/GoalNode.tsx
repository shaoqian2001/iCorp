"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Goal } from "@/lib/data";
import {
  CHILD_HORIZON,
  GOAL_STATUSES,
  HORIZON_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  type GoalTreeController,
} from "./goalMeta";

const INDENT_STEP = 3;
const CARET_WIDTH = 34;

export function GoalNode({
  goal,
  depth,
  controller,
}: {
  goal: Goal;
  depth: number;
  controller: GoalTreeController;
}) {
  const children = controller.childrenOf(goal.id);
  const hasChildren = children.length > 0;
  const expanded = controller.isExpanded(goal.id);
  const isEditing = controller.editingId === goal.id;
  const isAddingChild = controller.addingParentId === goal.id;
  const childHorizon = CHILD_HORIZON[goal.horizon];

  const [titleDraft, setTitleDraft] = useState(goal.title);
  const [childDraft, setChildDraft] = useState("");
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

  const startEdit = () => {
    setTitleDraft(goal.title);
    controller.setEditingId(goal.id);
  };
  const saveEdit = async () => {
    const title = titleDraft.trim();
    if (!title) return;
    await controller.rename(goal, title);
    controller.setEditingId(null);
  };
  const startAddChild = () => {
    if (!childHorizon) return;
    setChildDraft("");
    controller.expand(goal.id);
    controller.setAddingParentId(goal.id);
  };
  const saveAddChild = async () => {
    const title = childDraft.trim();
    if (!title) return;
    await controller.createChild(goal, title);
    setChildDraft("");
    controller.setAddingParentId(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 0.75,
          pl: depth * INDENT_STEP,
          borderRadius: 1,
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={() => controller.toggleExpanded(goal.id)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: CARET_WIDTH, flexShrink: 0 }} />
        )}

        {isEditing ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: 1 }}
          >
            <TextField
              size="small"
              fullWidth
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveEdit();
                if (e.key === "Escape") controller.setEditingId(null);
              }}
            />
            <IconButton
              size="small"
              color="primary"
              onClick={() => void saveEdit()}
              disabled={!titleDraft.trim()}
              aria-label="Save"
            >
              <CheckIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => controller.setEditingId(null)}
              aria-label="Cancel"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        ) : (
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              noWrap
              fontWeight={goal.horizon === "north_star" ? 700 : 500}
            >
              {goal.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {HORIZON_LABEL[goal.horizon]}
              {goal.targetMetric ? ` · ${goal.targetMetric}` : ""}
            </Typography>
          </Box>
        )}

        {!isEditing && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              size="small"
              label={STATUS_LABEL[goal.status]}
              color={STATUS_COLOR[goal.status]}
              variant={goal.status === "dropped" ? "outlined" : "filled"}
              onClick={(e) => setStatusAnchor(e.currentTarget)}
            />
            {childHorizon ? (
              <Tooltip
                title={`Add ${HORIZON_LABEL[childHorizon].toLowerCase()} goal`}
              >
                <IconButton size="small" onClick={startAddChild} aria-label="Add child goal">
                  <AddIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title="Rename">
              <IconButton size="small" onClick={startEdit} aria-label="Rename goal">
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archive">
              <IconButton
                size="small"
                onClick={() => void controller.archive(goal)}
                aria-label="Archive goal"
              >
                <ArchiveOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
      >
        {GOAL_STATUSES.map((status) => (
          <MenuItem
            key={status}
            selected={status === goal.status}
            onClick={() => {
              void controller.setStatus(goal, status);
              setStatusAnchor(null);
            }}
          >
            {STATUS_LABEL[status]}
          </MenuItem>
        ))}
      </Menu>

      {(hasChildren || isAddingChild) && (
        <Collapse in={expanded || isAddingChild} unmountOnExit>
          {children.map((child) => (
            <GoalNode
              key={child.id}
              goal={child}
              depth={depth + 1}
              controller={controller}
            />
          ))}
          {isAddingChild && childHorizon ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.75,
                pl: (depth + 1) * INDENT_STEP,
              }}
            >
              <Box sx={{ width: CARET_WIDTH, flexShrink: 0 }} />
              <TextField
                size="small"
                fullWidth
                autoFocus
                placeholder={`New ${HORIZON_LABEL[childHorizon].toLowerCase()} goal`}
                value={childDraft}
                onChange={(e) => setChildDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveAddChild();
                  if (e.key === "Escape") controller.setAddingParentId(null);
                }}
              />
              <IconButton
                size="small"
                color="primary"
                onClick={() => void saveAddChild()}
                disabled={!childDraft.trim()}
                aria-label="Add goal"
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => controller.setAddingParentId(null)}
                aria-label="Cancel"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          ) : null}
        </Collapse>
      )}
    </Box>
  );
}
