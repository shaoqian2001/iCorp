"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import NextLink from "next/link";

export function AccountMenu() {
  const { data: session, status } = useSession();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <Tooltip title="Sign in to sync">
        <Button
          color="inherit"
          size="small"
          startIcon={<LoginIcon />}
          onClick={() => void signIn("github")}
        >
          Sign in
        </Button>
      </Tooltip>
    );
  }

  const label = session.user.name || session.user.email || "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <>
      <Tooltip title={label}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account">
          <Avatar
            src={session.user.image ?? undefined}
            sx={{ width: 30, height: 30, fontSize: 14 }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem disabled>
          <Typography variant="body2" noWrap>
            {label}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          component={NextLink}
          href="/settings"
          onClick={() => setAnchor(null)}
        >
          <ListItemIcon>
            <CloudOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Sync settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            void signOut();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
