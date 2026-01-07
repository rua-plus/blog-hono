import { Hono } from "hono";
import { db, formatErrorMessage } from "../db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { registerUsers } from "./users.ts";

export function registerRoutes(app: Hono) {
  app.get("/", (c) => {
    return honoSuccessResponse(
      c,
      { message: "Hello Hono!" },
      "欢迎使用博客API",
    );
  });

  app.get("/db-version", async (c) => {
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

  registerUsers(app);
}
