import Fastify from "fastify";

import { authPlugin } from "./plugins/auth.js";
import { registerRoutes } from "./routes/index.js";
import { createRuntime, type AppRuntime, type AIProvider, type EmailProvider } from "./services/runtime.js";
import { MemoryStore } from "./repositories/memory.js";

export function buildApp(options?: {
  store?: MemoryStore;
  emailProvider?: EmailProvider;
  aiProvider?: AIProvider;
}) {
  const app = Fastify({
    logger: false,
  });

  const { runtime } = createRuntime({
    store: options?.store,
    emailProvider: options?.emailProvider,
    aiProvider: options?.aiProvider,
  });

  app.decorate("runtime", runtime as AppRuntime);

  app.setErrorHandler((error, _request, reply) => {
    if (!reply.sent) {
      reply.code(500).send({
        message: error instanceof Error ? error.message : "Unexpected server error.",
      });
    }
  });

  void app.register(authPlugin);
  void app.register(registerRoutes);

  return app;
}
