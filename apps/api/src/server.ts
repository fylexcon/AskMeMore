import { buildApp } from "./app.js";
import { env } from "./config.js";

const app = buildApp();

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
