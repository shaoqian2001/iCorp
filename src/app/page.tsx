import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function DashboardPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="overline" color="primary">
          Solo Studio · Demo v1
        </Typography>
        <Typography variant="h3" component="h1">
          Workspace
        </Typography>
        <Typography color="text.secondary">
          Local-first scaffold is up and running. The data layer, seed data,
          and feature views (goals, tasks, roadmap, review) come next.
        </Typography>
      </Box>
    </Container>
  );
}
