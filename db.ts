// Import PostgreSQL client
import { Client } from "postgres";

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

function handleError(error: unknown, context: string): never {
  const errorMessage = formatErrorMessage(error, context);
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Read configuration from config.json
let configFile: string;
try {
  configFile = Deno.readTextFileSync(
    new URL("./config.json", import.meta.url),
  );
} catch (error: unknown) {
  handleError(error, "reading config.json");
}

// Define configuration types
interface Config {
  postgresql: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

let config: Config;
try {
  config = JSON.parse(configFile);
} catch (error: unknown) {
  handleError(error, "parsing config.json");
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
