import { Hono } from "hono";
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

  registerUsers(app);
  registerPosts(app);

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
    console.log("onError", err);
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
