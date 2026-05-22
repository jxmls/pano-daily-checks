// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL ?? "";

export default defineConfig({
  datasource: {
    adapter: new PrismaPg(new Pool({ connectionString })),
    url: connectionString,
  },
});
