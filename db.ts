// Import PostgreSQL client
import { Client } from "postgres";

// Read configuration from config.json
let configFile: string;
try {
  configFile = Deno.readTextFileSync(
    new URL("./config.json", import.meta.url),
  );
} catch (error: unknown) {
  let errorMessage: string;
  if (error instanceof Deno.errors.NotFound) {
    errorMessage = `Error reading config.json: File not found`;
  } else if (error instanceof Deno.errors.PermissionDenied) {
    errorMessage = `Error reading config.json: Permission denied`;
  } else if (error instanceof Error) {
    errorMessage = `Error reading config.json: ${error.message}`;
  } else {
    errorMessage = `Error reading config.json: Unknown error`;
  }
  console.error(errorMessage);
  throw new Error(errorMessage);
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
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = `Error parsing config.json: ${error.message}`;
  } else {
    errorMessage = "Error parsing config.json: Unknown error";
  }
  console.error(errorMessage);
  throw new Error(errorMessage);
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
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error, null, 2);
    } else {
      errorMessage = String(error);
    }

    console.error("Error connecting to PostgreSQL database:", errorMessage);
    throw error; // Rethrow error to let the application handle it
  }
}

// Close database connection (async function)
export async function closeDB() {
  try {
    await db.end();
    console.log("Successfully closed PostgreSQL database connection!");
  } catch (error: unknown) {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error, null, 2);
    } else {
      errorMessage = String(error);
    }

    console.error(
      "Error closing PostgreSQL database connection:",
      errorMessage,
    );
    throw error;
  }
}
