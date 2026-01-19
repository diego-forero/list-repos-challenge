import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import githubRoutes from "./routes/github";
import favoritesRoutes from "./routes/favorites";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.APP_URL ?? "http://localhost:8080",
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

const port = Number(process.env.PORT ?? 3001);

app.listen(port, "0.0.0.0", () => {
  console.log(`[api] listening on http://localhost:${port}`);
});