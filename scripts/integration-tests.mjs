import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import "dotenv/config";

let url = process.env.TEST_DATABASE_URL;
if (!url) {
  try {
    url = JSON.parse(
      await readFile(".local/test-env.json", "utf8"),
    ).TEST_DATABASE_URL;
  } catch {
    console.error(
      "Démarrez npm run db:local ou configurez TEST_DATABASE_URL vers une base de test distincte.",
    );
    process.exit(1);
  }
}
if (process.env.DATABASE_URL) {
  const application = new URL(process.env.DATABASE_URL),
    testing = new URL(url);
  if (
    application.hostname === testing.hostname &&
    application.port === testing.port &&
    application.pathname === testing.pathname
  ) {
    console.error(
      "La base de test doit être différente de la base de l’application.",
    );
    process.exit(1);
  }
}
// Les migrations et tests ciblent uniquement la base de test explicitement configurée.
const env = { ...process.env, TEST_DATABASE_URL: url, DATABASE_URL: url };
for (const args of [
  [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
  [resolve("node_modules/tsx/dist/cli.mjs"), "--test", "server/*.test.ts"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
