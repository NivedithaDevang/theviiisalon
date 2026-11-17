import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { db } from "./config/database.js";
import { REACTURL } from "./config/env.js";
import router from "./routes/index.js";
const app = express();
const corsOptions = {
    origin: (origin, callback) => {
        // Allows requests without origin (e.g., Postman/mobile apps) or matching frontend URL
        if (!origin || origin === REACTURL) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// Base endpoints
app.get("/", (_req, res) => {
    res.json({ message: "CityPass API is running" });
});
app.get("/status", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.get("/health", async (_req, res) => {
    try {
        await db.query("SELECT 1");
        res.status(200).json({
            status: "ok",
            database: "connected",
        });
    }
    catch (error) {
        res.status(503).json({
            status: "error",
            database: "disconnected",
        });
    }
});
// API routes
app.use("/api", router);
app.use(router);
export default app;
//# sourceMappingURL=app.js.map