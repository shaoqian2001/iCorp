import { createTheme } from "@mui/material/styles";

// Material 3-flavoured theme with light + dark color schemes driven by MUI's
// CSS variables. `colorSchemeSelector: "class"` lets a manual toggle switch
// modes (via useColorScheme) without a server/client flash — paired with
// <InitColorSchemeScript attribute="class" /> in the root layout.
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: true,
    dark: true,
  },
  shape: {
    borderRadius: 12,
  },
});
