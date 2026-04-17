import type { FastifyPluginAsync } from "fastify";

import { EntitlementStatusSchema, RedeemUnlockCodeSchema } from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

export const entitlementRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/entitlements/redeem",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(RedeemUnlockCodeSchema, request.body, reply);
      if (!body) {
        return;
      }

      let relationshipId = app.runtime.store.getRelationshipIdForUser(request.viewer.userId);
      if (!relationshipId) {
        const relationship = app.runtime.store.createRelationship(request.viewer.userId, "Our Connection");
        relationshipId = relationship?.id ?? null;
      }

      if (!relationshipId) {
        reply.code(400).send({ message: "Relationship is required before redeeming." });
        return;
      }

      const result = app.runtime.store.redeemUnlockCode(body.code, request.viewer.userId, relationshipId);
      if ("error" in result) {
        const code = result.error === "not_found" ? 404 : 409;
        reply.code(code).send({
          message: result.error === "not_found" ? "Unlock code not found." : "Unlock code was already redeemed.",
        });
        return;
      }

      return EntitlementStatusSchema.parse(app.runtime.store.getEntitlement(relationshipId));
    },
  );

  app.get(
    "/v1/entitlements/me",
    {
      preHandler: app.authenticate,
    },
    async (request) => {
      if (!request.viewer) {
        return null;
      }

      const relationshipId = app.runtime.store.getRelationshipIdForUser(request.viewer.userId);
      return EntitlementStatusSchema.parse(app.runtime.store.getEntitlement(relationshipId));
    },
  );
};
