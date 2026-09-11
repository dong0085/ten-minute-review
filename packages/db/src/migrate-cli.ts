import { config } from "dotenv";
import { runMigrations } from "./migrate";

config({ path: ["../../.env", ".env"] });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required to run migrations");
}

await runMigrations(url);
console.log("migrations applied");
