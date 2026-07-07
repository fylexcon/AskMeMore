import type { FastifyPluginAsync } from "fastify";

import { AIQuestionRequestSchema, AIQuestionResponseSchema } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

import { parseWithSchema } from "../helpers.js";

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/ai/questions",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(AIQuestionRequestSchema, request.body, reply);
      if (!body) {
        return;
      }

      const relationshipId = await app.runtime.store.getRelationshipIdForUser(request.viewer.userId);
      const entitlement = await app.runtime.store.getEntitlement(relationshipId);
      if (!entitlement.premiumUnlocked) {
        reply.code(403).send({ message: "Premium access is required for AI questions." });
        return;
      }

      if (!app.runtime.checkAiRateLimit(request.viewer.userId)) {
        reply.code(429).send({ message: "AI rate limit exceeded. Try again later." });
        return;
      }

      const category = deckManifest.categories.find((entry) => entry.id === body.categoryId);
      if (!category) {
        reply.code(400).send({ message: "Unknown category." });
        return;
      }

      const startedAt = Date.now();
      const question = await app.runtime.aiProvider.generateQuestion({
        categoryLabel: category.label,
        categoryDescription: category.description,
        depth: body.depth,
        recentQuestions: body.recentQuestions,
        model: app.runtime.env.ANTHROPIC_MODEL,
      });

      const cleaned = question.replace(/^["']+|["']+$/g, "").trim();
      const screened = app.runtime.screenQuestion(cleaned, body.recentQuestions);

      await app.runtime.store.appendAIRequest({
        userId: request.viewer.userId,
        relationshipId,
        categoryId: body.categoryId,
        depth: body.depth,
        model: app.runtime.env.ANTHROPIC_MODEL,
        questionHash: app.runtime.hashValue(cleaned),
        status: screened.ok ? "success" : "rejected",
        createdAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      });

      if (!screened.ok) {
        reply.code(422).send({ message: screened.reason ?? "AI response failed safety checks." });
        return;
      }

      return AIQuestionResponseSchema.parse({
        question: cleaned,
        source: "ai",
        model: app.runtime.env.ANTHROPIC_MODEL,
        generatedAt: new Date().toISOString(),
      });
    },
  );
};
