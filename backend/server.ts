import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error Cloudflare injects this virtual module at runtime.
import { httpServerHandler } from "cloudflare:node";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { SERVER_PORT } from "./config/env.js";
import { authModel } from "./model/authModel.js";
import type {
  ExecutionContext,
  IncomingRequestCfProperties,
  Request as WorkerRequest,
  Response as WorkerResponse,
  Fetcher,
} from "@cloudflare/workers-types";

let initPromise: Promise<ReturnType<typeof httpServerHandler>> | null = null;

function initApp(): Promise<ReturnType<typeof httpServerHandler>> {
  if (!initPromise) {
    initPromise = (async () => {
      const port = Number(process.env.SERVER_PORT || SERVER_PORT) || 3000;
      await connectDB();
      await authModel.ensureDefaultAdmin();
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
      return httpServerHandler({ port });
    })();
  }
  return initPromise;
}

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  initApp().catch((error: unknown) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
}

export default {
  async fetch(
    request: WorkerRequest<unknown, IncomingRequestCfProperties<unknown>>,
    env: Record<string, unknown> & { ASSETS?: Fetcher },
    ctx: ExecutionContext,
  ): Promise<WorkerResponse> {
    Object.assign(process.env, env);

    const url = new URL(request.url);

    // If request is for an API route or ASSETS binding is not configured, delegate to Express handler
    if (url.pathname.startsWith("/api") || !env.ASSETS) {
      const handler = await initApp();
      if (!handler.fetch) {
        throw new Error("Cloudflare HTTP server handler is unavailable");
      }
      return handler.fetch(request, env, ctx) as unknown as WorkerResponse;
    }

    // Serve static frontend assets and SPA routes via Cloudflare Workers Assets
    return env.ASSETS.fetch(request as any) as unknown as WorkerResponse;
  },
};
