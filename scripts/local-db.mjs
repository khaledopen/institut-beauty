import EmbeddedPostgres from "embedded-postgres";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";

// Outil de développement : fichiers et identifiants restent dans .local et .env.
const folder = resolve(".local");
// Ces exclusions restent propres au clone : aucun fichier d’environnement n’est publié.
try {
  const excludePath = resolve(".git/info/exclude");
  const current = await readFile(excludePath, "utf8");
  const rules = [
    "/.local/",
    "/.env",
    "/.env.*",
    "/node_modules/",
    "/dist/",
    "*.log",
  ];
  await writeFile(
    excludePath,
    current +
      "\n" +
      rules
        .filter((rule) => !current.split(/\r?\n/).includes(rule))
        .join("\n") +
      "\n",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(folder, { recursive: true });
let config;
try {
  config = JSON.parse(
    await readFile(resolve(folder, "db-config.json"), "utf8"),
  );
} catch {
  config = {
    port: 55432,
    user: "belleza",
    password: randomBytes(24).toString("hex"),
  };
  await writeFile(resolve(folder, "db-config.json"), JSON.stringify(config), {
    mode: 0o600,
  });
}
const pg = new EmbeddedPostgres({
  databaseDir: resolve(folder, "postgres"),
  user: config.user,
  password: config.password,
  port: config.port,
  persistent: true,
  postgresFlags: ["-h", "127.0.0.1"],
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
  onError: (message) => console.error(String(message)),
});
await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
for (const name of ["belleza", "belleza_test"]) {
  const found = await client.query(
    "SELECT 1 FROM pg_database WHERE datname=$1",
    [name],
  );
  if (!found.rowCount) await pg.createDatabase(name);
}
await client.end();
const databaseUrl = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/belleza?schema=public`;
const testUrl = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/belleza_test?schema=public`;
await writeFile(
  resolve(folder, "test-env.json"),
  JSON.stringify({ TEST_DATABASE_URL: testUrl }),
  { mode: 0o600 },
);
try {
  await access(".env");
} catch {
  await writeFile(
    ".env",
    `DATABASE_URL="${databaseUrl}"\nPORT=3001\nAPP_ORIGIN=${process.env.APP_ORIGIN || "http://127.0.0.1:5173"}\nNODE_ENV=development\n`,
    { mode: 0o600 },
  );
}
console.log(
  `PostgreSQL local prêt sur 127.0.0.1:${config.port}. Identifiants conservés localement.`,
);
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
