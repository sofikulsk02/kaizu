import { prisma } from "./prisma";
import { databaseUrl } from "../config";

export async function connectDatabase(): Promise<void> {
  console.log("database is running");
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    process.exit(1);
  }
}
