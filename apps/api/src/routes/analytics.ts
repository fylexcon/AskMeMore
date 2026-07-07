import type { FastifyPluginAsync } from "fastify";

import { AnalyticsEventSchema } from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/v1/analytics/events", async (request, reply) => {
    const body = parseWithSchema(AnalyticsEventSchema, request.body, reply);
    if (!body) {
      return;
    }

    const header = request.headers.authorization;
    const session =
      header?.startsWith("Bearer ")
        ? await app.runtime.validateAccessToken(header.slice("Bearer ".length))
        : null;

    await app.runtime.store.appendAnalytics({
      eventName: body.eventName,
      platform: body.platform,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
      userId: session?.userId ?? null,
    });

    reply.code(202).send({ accepted: true });
  });
};
