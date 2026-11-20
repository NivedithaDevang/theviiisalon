import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { SERVER_PORT } from "./config/env.js";
import { authModel } from "./model/authModel.js";

const port = Number(SERVER_PORT) || 3000;

async function startServer(): Promise<void> {
  await connectDB();
  await authModel.ensureDefaultAdmin();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  startServer().catch((error: unknown) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
}

export default app;