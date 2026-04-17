import type { FastifyPluginAsync } from "fastify";

import { DeckManifestSchema } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

export const contentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/content/manifest", async () =>
    DeckManifestSchema.parse({
      ...deckManifest,
      version: app.runtime.store.contentManifest.version,
    }),
  );
};
