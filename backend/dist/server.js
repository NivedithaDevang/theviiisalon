import app from "./app.js";
import { connectDB } from "./config/database.js";
import { SERVER_PORT } from "./config/env.js";
import { authModel } from "./model/authModel.js";
const PORT = SERVER_PORT ?? 3000;
async function startServer() {
    try {
        await connectDB();
        await authModel.ensureDefaultAdmin();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Database connection failed. Shutting down server:", error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map