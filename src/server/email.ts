import { Resend } from "resend";

// Lazy on purpose, mirroring src/db/index.ts's db(). Constructing the Resend
// client at module scope makes RESEND_API_KEY a build-time dependency for
// every transitive importer — this previously broke the build when routing
// an avatar upload through actions/profile.ts pulled in this module and
// failed with "Missing API key" during page-data collection, invisible to
// tsc and caught only by `pnpm build`.
let _resend: Resend | null = null;

export function resend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const RESEND_FROM = process.env.RESEND_FROM ?? "hello@chavrutaanytime.com";
