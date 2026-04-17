import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/healthz", async () => ({
    ok: true,
    env: app.runtime.env.APP_ENV,
    contentVersion: app.runtime.store.contentManifest.version,
  }));
};
