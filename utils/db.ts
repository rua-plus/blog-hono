// Import PostgreSQL client
import { Client } from "postgres";
import { Config, handleError } from "./config.ts";

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

// Connect to the database (async function since connection is asynchronous)
export async function connectDB(config: Config) {
  try {
    const postgresConfig = config.postgresql;
    const db = new Client({
      hostname: postgresConfig.host, // postgres.js uses 'hostname' instead of 'host'
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      password: postgresConfig.password,
    });
    await db.connect();
    console.log("Successfully connected to PostgreSQL database!");
    return db;
  } catch (error: unknown) {
    handleError(error, "connecting to PostgreSQL database");
  }
}

// Close database connection (async function)
export async function closeDB(db: Client) {
  try {
    await db.end();
    console.log("Successfully closed PostgreSQL database connection!");
  } catch (error: unknown) {
    handleError(error, "closing PostgreSQL database connection");
  }
}
