import "fastify";

import type { AppRuntime } from "./services/runtime.js";
import type { Viewer } from "./types.js";

declare module "fastify" {
  interface FastifyInstance {
    runtime: AppRuntime;
  }

  interface FastifyRequest {
    viewer: Viewer | null;
  }
}
