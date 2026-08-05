// Shared types for the new session page and form to avoid circular imports
export type SessionContext =
  | { type: "chabura"; id: string; name: string; image: string | null; slug: string }
  | { type: "chavruta"; connectionId: string; partnerId: string; name: string; image: string | null };
