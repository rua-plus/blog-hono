import { Hono } from "hono";
import { connectDB, db, formatErrorMessage } from "./db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "./response.ts";

const app = new Hono();

app.get("/", (c) => {
  return honoSuccessResponse(c, { message: "Hello Hono!" }, "欢迎使用博客API");
});

app.get("/test-db", async (c) => {
  try {
    // Test a simple query
    const result = await db.queryArray("SELECT version()");
    return honoSuccessResponse(c, {
      postgres_version: result.rows[0][0],
    }, "数据库连接成功");
  } catch (error: unknown) {
    return honoErrorResponse(
      c,
      "数据库连接失败",
      StatusCode.DATABASE_ERROR,
      undefined,
      formatErrorMessage(error, "/test-db"),
    );
  }
});

// Connect to PostgreSQL when starting the application
connectDB().catch((error) => {
  console.error("Failed to start the application:", error);
  Deno.exit(1);
});

Deno.serve(app.fetch);
