import type { FastifyPluginAsync } from "fastify";

import {
  AdminCreateUnlockCodesResponseSchema,
  AdminCreateUnlockCodesSchema,
  FeatureFlagSchema,
  UpdateContentManifestSchema,
} from "@ask-me-more/contracts";

import { parseWithSchema, randomUpperToken } from "../helpers.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/admin/unlock-codes",
    {
      preHandler: app.authenticateAdmin,
    },
    async (request, reply) => {
      const body = parseWithSchema(AdminCreateUnlockCodesSchema, request.body, reply);
      if (!body) {
        return;
      }

      const codes = Array.from({ length: body.quantity }, () => randomUpperToken("AMM"));
      for (const code of codes) {
        app.runtime.store.saveUnlockCode({
          code,
          durationDays: body.durationDays,
          note: body.note,
          createdAt: new Date().toISOString(),
          redeemedAt: null,
          redeemedByUserId: null,
          redeemedRelationshipId: null,
        });
      }

      return AdminCreateUnlockCodesResponseSchema.parse({ codes });
    },
  );

  app.put(
    "/v1/admin/content-manifest",
    {
      preHandler: app.authenticateAdmin,
    },
    async (request, reply) => {
      const body = parseWithSchema(UpdateContentManifestSchema, request.body, reply);
      if (!body) {
        return;
      }

      app.runtime.store.setContentManifest({
        version: body.version,
        minimumSupportedAppVersion: body.minimumSupportedAppVersion,
      });

      return app.runtime.store.contentManifest;
    },
  );

  app.post(
    "/v1/admin/feature-flags",
    {
      preHandler: app.authenticateAdmin,
    },
    async (request, reply) => {
      const body = parseWithSchema(FeatureFlagSchema, request.body, reply);
      if (!body) {
        return;
      }

      app.runtime.store.setFeatureFlag(body);
      return body;
    },
  );
};
