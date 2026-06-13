import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Providers } from "@/components/shared/Providers";
import { DataBootstrap } from "@/components/shared/DataBootstrap";
import { AppShell } from "@/components/shared/AppShell";

export const metadata: Metadata = {
  title: "Solo Studio",
  description: "Local-first workspace for solo operators — Demo v1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <Providers>
            <DataBootstrap />
            <AppShell>{children}</AppShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
