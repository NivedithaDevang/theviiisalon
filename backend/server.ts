import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { REACTURL } from "./config/env.js";
import router from "./routes/index.js";

const app: Application = express();

// Normalize REACTURL (removes accidental trailing slashes and spaces)
const normalizedReactUrl = REACTURL?.trim().replace(/\/+$/, "");

const allowedOrigins = [
  normalizedReactUrl,
  "https://theviiisalon.pages.dev",
  "http://localhost:5173",
].filter((url): url is string => Boolean(url));

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, "");

    // Allow exact matches or Cloudflare Pages preview URLs (*.theviiisalon.pages.dev)
    if (
      allowedOrigins.includes(cleanOrigin) ||
      /^https:\/\/[a-z0-9-]+\.theviiisalon\.pages\.dev$/.test(cleanOrigin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
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