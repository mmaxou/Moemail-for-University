import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./app/lib/schema.ts",
  out: "./drizzle",
} satisfies Config;