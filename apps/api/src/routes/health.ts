import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/healthz", async () => {
    const manifest = app.runtime.store.contentManifest || await app.runtime.store.contentManifest;
    return {
      ok: true,
      env: app.runtime.env.APP_ENV,
      contentVersion: (manifest || { version: "1.0.0" }).version,
    };
  });
};
