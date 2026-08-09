import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { configureApiRoutes } from "./apps/api/src/index.js";
import { runWorkerLoop } from "./apps/api/src/worker.js";

try {
  process.loadEnvFile();
} catch {
  // Ignore if .env file is missing
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(express.json());

  // CORS configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.WEB_ORIGIN
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }));

  // Lightweight liveness health endpoint for Zerops / container checks
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "devflow-api",
      status: "online",
      timestamp: new Date().toISOString()
    });
  });

  // Mount Node.js Express backend API routes (/api/health, /api/status, /api/analysis, etc.)
  configureApiRoutes(app);

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] DevFlow API server running on http://0.0.0.0:${PORT} (Node ${process.version}, env: ${process.env.NODE_ENV || 'development'})`);
  });

  // Conditional worker startup:
  // In production, API service must NOT start a worker automatically unless DEVFLOW_RUN_WORKER=true.
  const shouldRunWorker = 
    process.env.DEVFLOW_RUN_WORKER === 'true' || 
    (process.env.NODE_ENV !== 'production' && process.env.DEVFLOW_RUN_WORKER !== 'false');

  if (shouldRunWorker) {
    console.log('[server] Starting background worker loop in this process...');
    runWorkerLoop().catch((err) => {
      console.error("[server] Worker loop error:", err);
    });
  } else {
    console.log('[server] Background worker loop disabled in this process (API-only mode).');
  }
}

startServer();

