import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { REACTURL } from "./config/env.js";
import router from "./routes/index.js";
const app = express();
const configuredOrigins = (REACTURL ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        const cleanOrigin = origin.replace(/\/+$/, "");
        const isCloudflarePreview = /^https:\/\/[a-z0-9-]+\.theviiisalon\.pages\.dev$/.test(cleanOrigin);
        const isLocalFrontend = cleanOrigin === "http://localhost:5173";
        if (configuredOrigins.includes(cleanOrigin) ||
            cleanOrigin === "https://theviiisalon.pages.dev" ||
            isCloudflarePreview ||
            isLocalFrontend) {
            callback(null, true);
            return;
        }
        callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((req, res, next) => {
    const origin = req.get("origin");
    const host = req.get("host");
    if (origin && host) {
        try {
            const parsedOrigin = new URL(origin);
            if ((parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:") &&
                parsedOrigin.host === host) {
                next();
                return;
            }
        }
        catch {
            // Let the CORS middleware reject malformed origins.
        }
    }
    cors(corsOptions)(req, res, next);
});
app.use(express.json());
app.use(cookieParser());
// Base endpoint
app.get("/", (_req, res) => {
    res.json({ message: "The VIII salon API is running" });
});
// API routes
app.use("/api", router);
app.use(router);
export default app;
//# sourceMappingURL=app.js.map