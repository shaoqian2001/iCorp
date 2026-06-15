import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ComingSoonProps {
  title: string;
  description: string;
  /** Which milestone delivers this view, e.g. "Milestone 3". */
  milestone: string;
}

/**
 * Designed placeholder for routes whose feature view lands in a later
 * milestone. Keeps navigation whole and avoids blank screens.
 */
export function ComingSoon({ title, description, milestone }: ComingSoonProps) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">
          Solo Studio
        </Typography>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
      <Box
        sx={{
          p: 5,
          borderRadius: 3,
          border: "1px dashed",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography color="text.secondary">
          This view arrives in {milestone}.
        </Typography>
      </Box>
    </Container>
  );
}
