import { buildApp } from "./app.js";
import { env } from "./config.js";
import { PrismaStore } from "./repositories/prisma.js";

const app = buildApp({
  store: new PrismaStore(),
});

async function start() {
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });

  console.log(`Ask Me More API listening on ${env.PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
