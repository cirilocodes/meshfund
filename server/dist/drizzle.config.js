"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // <-- This loads .env variables before anything else
exports.default = {
    schema: "./schema.ts", // ✅ or "./schema" if it's a folder
    out: "./drizzle", // ✅ output folder for migrations
    driver: "pg", // ✅ PostgreSQL driver
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
    },
};
