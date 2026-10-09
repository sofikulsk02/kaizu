import express, { Express, Request, Response, NextFunction } from "express";
import router from "./routes";
import { prisma } from "./database/prisma";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFoundError } from "./core/ApiError";

const app: Express = express();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});

async function connectDatabase(): Promise<void> {
  console.log("Connecting to database...");
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}

// Enable CORS middleware for frontend communication
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-user-email");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

function setupRoutes(): void {
  app.use("/", router);

  // 404 handler for unhandled routes
  app.use((_req, _res, next) => next(new NotFoundError("Route not found")));

  // Global Error Handler
  app.use(errorHandler);
}

async function initializeApp(): Promise<Express> {
  await connectDatabase();
  setupRoutes();
  console.log("Application initialized");
  return app;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export { initializeApp };
export default app;
