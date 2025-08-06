import "dotenv/config"; // <-- This loads .env variables before anything else
import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",      // ✅ or "./schema" if it's a folder
  out: "./drizzle",           // ✅ output folder for migrations
  driver: "pg",               // ✅ PostgreSQL driver
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
