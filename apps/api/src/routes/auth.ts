import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import {
  AuthSessionSchema,
  RegisterSchema,
  LoginSchema,
  UserProfileSchema,
} from "@ask-me-more/contracts";

import { parseWithSchema } from "../helpers.js";
import bcrypt from "bcryptjs";

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

function toUserProfile(user: { id: string; email: string; username: string | null; createdAt: string }) {
  return UserProfileSchema.parse({
    id: user.id,
    email: user.email,
    username: user.username,
    relationshipId: null,
    createdAt: user.createdAt,
  });
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/v1/auth/register", async (request, reply) => {
    const body = parseWithSchema(RegisterSchema, request.body, reply);
    if (!body) return;

    const existing = await app.runtime.store.findUserByEmail(body.email);
    if (existing) {
      reply.code(400).send({ message: "Email already registered." });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await app.runtime.store.createUser(body.email, body.username, passwordHash);
    const session = await app.runtime.issueSession(user.id, body.deviceName);

    return AuthSessionSchema.parse({
      user: {
        ...toUserProfile(user),
        relationshipId: null,
      },
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresInSeconds: app.runtime.env.ACCESS_TOKEN_TTL_SECONDS,
      },
    });
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const body = parseWithSchema(LoginSchema, request.body, reply);
    if (!body) return;

    const authRecord = await app.runtime.store.getUserAuth(body.email);
    if (!authRecord || !authRecord.passwordHash) {
      reply.code(401).send({ message: "Invalid email or password." });
      return;
    }

    const valid = await bcrypt.compare(body.password, authRecord.passwordHash);
    if (!valid) {
      reply.code(401).send({ message: "Invalid email or password." });
      return;
    }

    const user = await app.runtime.store.findUserById(authRecord.id);
    if (!user) {
      reply.code(401).send({ message: "Invalid email or password." });
      return;
    }

    const session = await app.runtime.issueSession(user.id, body.deviceName);
    const relationship = await app.runtime.store.getRelationshipIdForUser(user.id);

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

    const session = await app.runtime.refreshSession(body.refreshToken);
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

    await app.runtime.revokeRefreshToken(body.refreshToken);
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

      const user = await app.runtime.store.findUserById(request.viewer.userId);
      if (!user) {
        reply.code(404).send({ message: "User not found." });
        return;
      }

      const relationshipId = await app.runtime.store.getRelationshipIdForUser(user.id);
      return UserProfileSchema.parse({
        id: user.id,
        email: user.email,
        username: user.username,
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

      await app.runtime.store.markUserDeleted(request.viewer.userId);
      reply.code(204).send();
    },
  );
};
