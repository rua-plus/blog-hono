// Import PostgreSQL client
import { Client } from "postgres";

// Read configuration from config.json using Deno's built-in synchronous API
// Read configuration from config.json
const configFile = Deno.readTextFileSync(
  new URL("../config.json", import.meta.url),
);
const config = JSON.parse(configFile);

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
