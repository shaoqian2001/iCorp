import type { DefaultSession } from "next-auth";

// Expose the stable user id (GitHub account id, from the JWT `sub`) on the
// session so API routes can key the workspace snapshot by user.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
