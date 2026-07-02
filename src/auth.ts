import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Auth.js v5 with GitHub OAuth and JWT sessions (no database adapter — the
// only cloud storage is the per-user workspace snapshot). Reads AUTH_SECRET,
// AUTH_GITHUB_ID, and AUTH_GITHUB_SECRET from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  // Trust the deployment host (Vercel sets this automatically; explicit here so
  // localhost `next start` and self-hosting work too).
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
