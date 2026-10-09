import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const port = process.env.PORT || 8000;
export const databaseUrl =
  process.env.DATABASE_URL || "postgres://user:password@localhost:5432/mydb";

export const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
export const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/auth/google/callback";

export const jwtSecret = process.env.JWT_SECRET || "kaizu_super_secret_jwt_key_change_me";
export const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Michi AI Assistant Config
export const geminiApiKey = process.env.GEMINI_API_KEY || "";
export const michiMaxInputChars = parseInt(process.env.MICHI_MAX_INPUT_CHARS || "2000", 10);
export const michiMaxHistoryMessages = parseInt(process.env.MICHI_MAX_HISTORY_MESSAGES || "10", 10);
export const michiMaxOutputTokens = parseInt(process.env.MICHI_MAX_OUTPUT_TOKENS || "1024", 10);
export const michiDailyRequestLimit = parseInt(process.env.MICHI_DAILY_REQUEST_LIMIT || "100", 10);
