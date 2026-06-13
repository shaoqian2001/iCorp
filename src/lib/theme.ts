import { createTheme } from "@mui/material/styles";

// Material 3-flavoured theme with light + dark color schemes driven by
// MUI's CSS variables. A manual light/dark toggle is added with the app
// shell; for now the schemes follow the OS preference.
export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: true,
    dark: true,
  },
  shape: {
    borderRadius: 12,
  },
});
