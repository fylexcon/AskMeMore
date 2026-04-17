import type { FastifyReply } from "fastify";
import type { z } from "zod";

export function parseWithSchema<T extends z.ZodTypeAny>(schema: T, input: unknown, reply: FastifyReply) {
  const result = schema.safeParse(input);
  if (!result.success) {
    reply.code(400).send({
      message: "Validation failed.",
      issues: result.error.flatten(),
    });
    return null;
  }
  return result.data;
}

export function randomUpperToken(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${random}`;
}
