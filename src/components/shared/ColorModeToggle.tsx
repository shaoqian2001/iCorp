"use client";

import { useEffect, useState } from "react";
import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

export function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  // useColorScheme resolves only on the client; render a stable placeholder
  // during SSR/first paint to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <IconButton color="inherit" disabled aria-label="Toggle color mode">
        <DarkModeOutlinedIcon />
      </IconButton>
    );
  }

  const resolved = mode === "system" ? systemMode : mode;
  const next = resolved === "dark" ? "light" : "dark";

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton
        color="inherit"
        onClick={() => setMode(next)}
        aria-label={`Switch to ${next} mode`}
      >
        {resolved === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
