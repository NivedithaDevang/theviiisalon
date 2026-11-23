import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error Cloudflare injects this virtual module at runtime.
import { httpServerHandler } from "cloudflare:node";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { SERVER_PORT } from "./config/env.js";
import { authModel } from "./model/authModel.js";
import type { ExecutionContext } from "@cloudflare/workers-types";

const port = Number(SERVER_PORT) || 3000;

let initPromise: Promise<void> | null = null;
function initApp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      await authModel.ensureDefaultAdmin();
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
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

const workerHandler = httpServerHandler({ port });

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    // Pass Cloudflare Runtime Secrets/Variables into process.env for ./config/env.js
    Object.assign(process.env, env);
    await initApp();
    return workerHandler.fetch(request, env, ctx);
  },
};