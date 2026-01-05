import { Hono } from "hono";
import { connectDB, db } from "./db.ts";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/test-db", async (c) => {
  try {
    // Test a simple query
    const result = await db.queryArray("SELECT version()");
    return c.json({
      success: true,
      postgres_version: result.rows[0][0],
    });
  } catch (error: unknown) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Connect to PostgreSQL when starting the application
connectDB().catch((error) => {
  console.error("Failed to start the application:", error);
  Deno.exit(1);
});

Deno.serve(app.fetch);
