import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import githubRoutes from "./routes/github.routes";
import favoritesRoutes from "./routes/favorites.routes";
import { isHttpError } from "./errors/httpError";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/github", githubRoutes);
  app.use("/favorites", favoritesRoutes);

  // Central error handler (asyncHandler forwards here)
  app.use((err: unknown, _req: any, res: any, _next: any) => {
    if (isHttpError(err)) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }

    console.error("[api] unhandled error:", err);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
