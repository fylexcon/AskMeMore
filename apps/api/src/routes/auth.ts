import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import {
  AuthSessionSchema,
  RequestOtpSchema,
  UserProfileSchema,
  VerifyOtpSchema,
} from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

function toUserProfile(user: { id: string; email: string; createdAt: string }) {
  return UserProfileSchema.parse({
    id: user.id,
    email: user.email,
    relationshipId: null,
    createdAt: user.createdAt,
  });
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/v1/auth/request-otp", async (request, reply) => {
    const body = parseWithSchema(RequestOtpSchema, request.body, reply);
    if (!body) {
      return;
    }

    const code = app.runtime.generateOtpCode();
    const expiresAt = new Date(Date.now() + app.runtime.env.OTP_TTL_SECONDS * 1000).toISOString();
    app.runtime.store.createOtp(body.email, code, body.deviceName, expiresAt);
    await app.runtime.emailProvider.sendOtp(body.email, code);

    return {
      sent: true,
      expiresInSeconds: app.runtime.env.OTP_TTL_SECONDS,
    };
  });

  app.post("/v1/auth/verify-otp", async (request, reply) => {
    const body = parseWithSchema(VerifyOtpSchema, request.body, reply);
    if (!body) {
      return;
    }

    const valid = app.runtime.store.validateOtp(body.email, body.code);
    if (!valid) {
      reply.code(400).send({ message: "Invalid or expired code." });
      return;
    }

    const user = app.runtime.store.upsertUser(body.email);
    const session = app.runtime.issueSession(user.id, body.deviceName);
    const relationship = app.runtime.store.getRelationshipIdForUser(user.id);

    return AuthSessionSchema.parse({
      user: {
        ...toUserProfile(user),
        relationshipId: relationship,
      },
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresInSeconds: app.runtime.env.ACCESS_TOKEN_TTL_SECONDS,
      },
    });
  });

  app.post("/v1/auth/refresh", async (request, reply) => {
    const body = parseWithSchema(RefreshSchema, request.body, reply);
    if (!body) {
      return;
    }

    const session = app.runtime.refreshSession(body.refreshToken);
    if (!session) {
      reply.code(401).send({ message: "Refresh token is invalid." });
      return;
    }

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: app.runtime.env.ACCESS_TOKEN_TTL_SECONDS,
    };
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    const body = parseWithSchema(RefreshSchema, request.body, reply);
    if (!body) {
      return;
    }

    app.runtime.revokeRefreshToken(body.refreshToken);
    reply.code(204).send();
  });

  app.get(
    "/v1/me",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      const user = app.runtime.store.findUserById(request.viewer.userId);
      if (!user) {
        reply.code(404).send({ message: "User not found." });
        return;
      }

      const relationshipId = app.runtime.store.getRelationshipIdForUser(user.id);
      return UserProfileSchema.parse({
        id: user.id,
        email: user.email,
        relationshipId,
        createdAt: user.createdAt,
      });
    },
  );

  app.delete(
    "/v1/me",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.viewer) {
        return;
      }

      app.runtime.store.markUserDeleted(request.viewer.userId);
      reply.code(204).send();
    },
  );
};
