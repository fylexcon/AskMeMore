import type { FastifyPluginAsync } from "fastify";

import { ProgressSummarySchema, SyncProgressResultSchema, SyncProgressSchema } from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/progress/sync",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(SyncProgressSchema, request.body, reply);
      if (!body) {
        return;
      }

      const syncedAt = app.runtime.store.upsertProgress(request.viewer.userId, body.rollups);
      return SyncProgressResultSchema.parse({
        acceptedKeys: body.rollups.map((rollup: (typeof body.rollups)[number]) => rollup.key),
        syncedAt,
      });
    },
  );

  app.get(
    "/v1/progress/summary",
    {
      preHandler: app.authenticate,
    },
    async (request) => {
      if (!request.viewer) {
        return null;
      }

      return ProgressSummarySchema.parse(app.runtime.store.getProgressSummary(request.viewer.userId));
    },
  );
};
