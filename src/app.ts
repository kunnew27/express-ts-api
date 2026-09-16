import express from "express";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";
import "@/models/permission.model"; // registers Permission schema for populate()

import authRoutes from "@/routes/auth.routes";
import userRoutes from "@/routes/user.routes";
import roleRoutes from "@/routes/role.routes";
import { globalLimiter, authLimiter } from "@/middleware/rateLimit";
import notFound from "@/middleware/notFound";
import globalErrorHandler from "@/middleware/errorHandler";
import openApiSpec from "@/docs/openapi";

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ───────────────────────────────────────────────────────────
app.use(globalLimiter);                    // 100 req / 15 min  — all routes
app.use("/api/auth", authLimiter);         // 10  req / 15 min  — auth only

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

// ── Docs: OpenAPI JSON + Scalar UI ─────────────────────────────────────────
app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  "/docs",
  apiReference({
    spec: { url: "/openapi.json" },
    theme: "default",
    layout: "modern",
    defaultHttpClient: { targetKey: "js", clientKey: "fetch" },
  }),
);

// ── Error handling (order matters) ─────────────────────────────────────────
app.use(notFound); // ← must be after all routes
app.use(globalErrorHandler); // ← must be last

export default app;
