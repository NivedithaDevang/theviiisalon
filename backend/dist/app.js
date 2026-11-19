import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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