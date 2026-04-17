import type { FastifyPluginAsync } from "fastify";

import {
  CreateRelationshipSchema,
  JoinRelationshipSchema,
  RelationshipSummarySchema,
} from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

export const relationshipRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/relationships/create",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(CreateRelationshipSchema, request.body, reply);
      if (!body) {
        return;
      }

      const relationship = app.runtime.store.createRelationship(request.viewer.userId, body.displayName);
      if (!relationship) {
        reply.code(400).send({ message: "Could not create relationship." });
        return;
      }

      const summary = app.runtime.store.getRelationshipForUser(request.viewer.userId);
      return RelationshipSummarySchema.parse(summary);
    },
  );

  app.post(
    "/v1/relationships/join",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const body = parseWithSchema(JoinRelationshipSchema, request.body, reply);
      if (!body) {
        return;
      }

      const result = app.runtime.store.joinRelationship(request.viewer.userId, body.inviteCode);
      if ("error" in result) {
        if (result.error === "not_found") {
          reply.code(404).send({ message: "Invite code not found." });
          return;
        }

        if (result.error === "full") {
          reply.code(409).send({ message: "Relationship already has two members." });
          return;
        }

        reply.code(409).send({ message: "User already belongs to a relationship." });
        return;
      }

      const summary = app.runtime.store.getRelationshipForUser(request.viewer.userId);
      return RelationshipSummarySchema.parse(summary);
    },
  );

  app.get(
    "/v1/relationships/me",
    {
      preHandler: app.authenticate,
    },
    async (request) => {
      if (!request.viewer) {
        return null;
      }

      const relationship = app.runtime.store.getRelationshipForUser(request.viewer.userId);
      return relationship ? RelationshipSummarySchema.parse(relationship) : null;
    },
  );
};
