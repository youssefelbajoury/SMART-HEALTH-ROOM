import express from "express";
import { createServer } from "http";
import {initSocketIO} from "./services/websocket.service.js";
import { startDeviceWatcher } from "./services/deviceWatcher.service.js";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { networkInterfaces } from "os";
import { env } from "./config/env.js";
import { connectDB } from "./config/database.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { seedAdmin } from "./services/seedAdmin.service.js";

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(helmet());
app.use(compression());
// Flutter's web dev server (`flutter run -d chrome`) binds to a random
// localhost port each run, so a fixed allow-list can't name it in advance.
// In development, allow any localhost/127.0.0.1 origin (any port) in
// addition to the known web app origins; production keeps the strict list.
const allowedOrigins = ["http://localhost:3000", "http://192.168.1.100:3000"];
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // same-origin / non-browser requests (curl, mobile apps)
  if (allowedOrigins.includes(origin)) return true;
  if (env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    websocket: "enabled",
  });
});

// Start server
const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    // Initialize WebSocket
    initSocketIO(httpServer);
    startDeviceWatcher();

    // Écoute sur 0.0.0.0 pour accepter les connexions externes (ESP32)
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🌐 Network access: http://0.0.0.0:${PORT}`);
      logger.info(`📡 WebSocket ready on ws://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);

      // Affiche toutes les IPs disponibles
      const nets = networkInterfaces();
      logger.info("📶 Available network interfaces:");
      for (const name of Object.keys(nets)) {
        const netList = nets[name];
        if (!netList) continue;
        for (const net of netList) {
          if (net.family === "IPv4" && !net.internal) {
            logger.info(`   ${name}: http://${net.address}:${PORT}`);
          }
        }
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
