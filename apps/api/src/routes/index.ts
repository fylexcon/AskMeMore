import type { FastifyPluginAsync } from "fastify";

import { adminRoutes } from "./admin.js";
import { aiRoutes } from "./ai.js";
import { analyticsRoutes } from "./analytics.js";
import { authRoutes } from "./auth.js";
import { contentRoutes } from "./content.js";
import { entitlementRoutes } from "./entitlements.js";
import { healthRoutes } from "./health.js";
import { progressRoutes } from "./progress.js";
import { relationshipRoutes } from "./relationships.js";
import { reportRoutes } from "./reports.js";

export const registerRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(relationshipRoutes);
  await app.register(entitlementRoutes);
  await app.register(progressRoutes);
  await app.register(contentRoutes);
  await app.register(aiRoutes);
  await app.register(analyticsRoutes);
  await app.register(reportRoutes);
  await app.register(adminRoutes);
};
