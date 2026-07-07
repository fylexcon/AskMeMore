import type { FastifyPluginAsync } from "fastify";

import { ReportQuestionSchema } from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/reports/question",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(ReportQuestionSchema, request.body, reply);
      if (!body) {
        return;
      }

      await app.runtime.store.appendReportedQuestion({
        ...body,
        userId: request.viewer.userId,
        createdAt: new Date().toISOString(),
      });

      reply.code(202).send({ accepted: true });
    },
  );
};
