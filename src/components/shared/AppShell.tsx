"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { ColorModeToggle } from "./ColorModeToggle";

const DRAWER_WIDTH = 240;

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <DashboardOutlinedIcon /> },
  { href: "/goals", label: "Goals", icon: <FlagOutlinedIcon /> },
  { href: "/tasks", label: "Tasks", icon: <ViewKanbanOutlinedIcon /> },
  { href: "/roadmap", label: "Roadmap", icon: <TimelineOutlinedIcon /> },
  { href: "/review", label: "Review", icon: <RateReviewOutlinedIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsOutlinedIcon /> },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeHref =
    NAV_ITEMS.find((item) => isActive(pathname, item.href))?.href ?? "/";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Solo Studio
          </Typography>
          <ColorModeToggle />
        </Toolbar>
      </AppBar>

      {/* Desktop: permanent left drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={NextLink}
                href={item.href}
                selected={isActive(pathname, item.href)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pb: { xs: 8, md: 0 },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Mobile: fixed bottom navigation */}
      <Paper
        elevation={3}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (t) => t.zIndex.drawer + 2,
        }}
      >
        <BottomNavigation value={activeHref} showLabels>
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.href}
              component={NextLink}
              href={item.href}
              value={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
