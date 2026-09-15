import express, { Express } from "express";
import router from "./router";
import { prisma } from "./database/prisma";
const app: Express = express();

process.on("uncaughtException", (err) => {
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled promise rejection:", reason);
  process.exit(1);
});

async function connectDatabase(): Promise<void> {
  console.log("Connecting to the database...");
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    process.exit(1);
  }
}

app.use(express.json());

function setupRoutes(): void {
  app.use("/", router);

  // 404 handler
  // app.use((_req, _res, next) => next(new NotFoundError()));

  // Error handler
  // app.use(errorHandler);
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
