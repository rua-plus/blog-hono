import { Hono } from "hono";
import { db, formatErrorMessage } from "../utils/db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { registerUsers } from "./users.ts";
import { registerPosts } from "./posts.ts";

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
  registerPosts(app); // 添加文章路由注册

  // 404 未找到路由处理
  app.notFound((c) => {
    return honoErrorResponse(
      c,
      "接口不存在",
      StatusCode.RESOURCE_NOT_FOUND,
    );
  });

  // 405 方法不允许处理
  app.onError((err, c) => {
    if (err instanceof Error && err.message.includes("Method Not Allowed")) {
      return honoErrorResponse(
        c,
        "HTTP 方法不允许",
        StatusCode.METHOD_NOT_ALLOWED,
      );
    }
    // 其他错误处理
    return honoErrorResponse(
      c,
      "服务器内部错误",
      StatusCode.INTERNAL_ERROR,
      undefined,
      err instanceof Error ? err.message : "未知错误",
    );
  });
}
