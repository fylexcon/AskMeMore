import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

async function requireAccessToken(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ message: "Missing access token." });
  }

  const accessToken = header.slice("Bearer ".length);
  const session = request.server.runtime.validateAccessToken(accessToken);
  if (!session) {
    return reply.code(401).send({ message: "Invalid session." });
  }

  request.viewer = { userId: session.userId };
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const adminToken = request.headers["x-admin-token"];
  if (adminToken !== request.server.runtime.env.ADMIN_TOKEN) {
    return reply.code(401).send({ message: "Missing admin credentials." });
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("viewer", null);
  app.decorate("authenticate", requireAccessToken);
  app.decorate("authenticateAdmin", requireAdmin);
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authenticateAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
