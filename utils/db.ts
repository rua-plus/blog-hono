// Import PostgreSQL client
import { Client } from "postgres";
import { handleError } from "./config.ts";
import { config } from "../main.ts";

// 通用错误处理函数
export function formatErrorMessage(error: unknown, context: string): string {
  let errorMessage: string;
  if (error instanceof Deno.errors.NotFound) {
    errorMessage = `Error ${context}: File not found`;
  } else if (error instanceof Deno.errors.PermissionDenied) {
    errorMessage = `Error ${context}: Permission denied`;
  } else if (error instanceof Error) {
    errorMessage = `Error ${context}: ${error.message}`;
  } else if (typeof error === "object" && error !== null) {
    errorMessage = `Error ${context}: ${JSON.stringify(error, null, 2)}`;
  } else {
    errorMessage = `Error ${context}: ${String(error)}`;
  }
  return errorMessage;
}

// Extract PostgreSQL configuration
const postgresConfig = config.postgresql;

// Create PostgreSQL client
export const db = new Client({
  hostname: postgresConfig.host, // postgres.js uses 'hostname' instead of 'host'
  port: postgresConfig.port,
  database: postgresConfig.database,
  user: postgresConfig.user,
  password: postgresConfig.password,
});

// Connect to the database (async function since connection is asynchronous)
export async function connectDB() {
  try {
    await db.connect();
    console.log("Successfully connected to PostgreSQL database!");
  } catch (error: unknown) {
    handleError(error, "connecting to PostgreSQL database");
  }
}

// Close database connection (async function)
export async function closeDB() {
  try {
    await db.end();
    console.log("Successfully closed PostgreSQL database connection!");
  } catch (error: unknown) {
    handleError(error, "closing PostgreSQL database connection");
  }
}
