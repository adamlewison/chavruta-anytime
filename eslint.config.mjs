import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture rules live in scripts/check-architecture.mjs (`pnpm check:arch`),
 * which owns the baseline of pre-existing violations. The subset encoded here is
 * the part already at zero violations, so it can be a hard error and still keep
 * `pnpm lint` green — the payoff is in-editor feedback while typing.
 * See ARCHITECTURE.md §3.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Components render; they never reach for the database.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/db", "@/db/*"],
          message:
            "Components must not access the database. Fetch in src/server/queries/ and pass data down. See ARCHITECTURE.md §3.",
        }],
      }],
    },
  },

  {
    // Domain logic must stay runnable and testable without the framework.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: [
            "next", "next/*", "react", "react-dom",
            "@/db", "@/db/*", "@/server", "@/server/*",
            "@/components", "@/components/*",
          ],
          message:
            "src/domain must be framework-free and DB-free. See ARCHITECTURE.md §3.",
        }],
      }],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
