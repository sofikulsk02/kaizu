import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const port = process.env.PORT || 8000;
export const databaseUrl =
  process.env.DATABASE_URL || "postgres://user:password@localhost:5432/mydb";
