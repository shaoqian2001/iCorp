import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Providers } from "@/components/shared/Providers";
import { DataBootstrap } from "@/components/shared/DataBootstrap";

export const metadata: Metadata = {
  title: "Solo Studio",
  description: "Local-first workspace for solo operators — Demo v1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <DataBootstrap />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
