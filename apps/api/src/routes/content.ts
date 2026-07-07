import type { FastifyPluginAsync } from "fastify";

import { DeckManifestSchema } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

export const contentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/content/manifest", async () => {
    const manifest = app.runtime.store.contentManifest || await app.runtime.store.contentManifest; // wait, contentManifest is a property on memory store but a promise in interface if we made it one? We added it as contentManifest?: any to IStore. Wait, memory store has it as a property, prisma store doesn't have it as a property, we need a method or property.
    return DeckManifestSchema.parse({
      ...deckManifest,
      version: (manifest || { version: "1.0.0" }).version,
    });
  });
};
