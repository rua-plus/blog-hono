import type { Context, Next } from "hono";
import { nanoid } from "@sitnik/nanoid";
import { verifyToken } from "./utils/jwt.ts";
import { honoErrorResponse, StatusCode } from "./response.ts";
import { logger } from "./utils/logger.ts";

// 请求ID中间件
export async function requestIdMiddleware(c: Context, next: Next) {
  // 生成唯一请求ID
  const requestId = nanoid();

  // 将请求ID存储到上下文变量中
  c.set("requestId", requestId);

  // 将请求ID添加到响应头中
  c.header("X-Request-ID", requestId);

  // 继续处理下一个中间件或路由
  await next();
}

// 获取请求ID的辅助函数
export function getRequestId(c: Context): string {
  return c.get("requestId") as string;
}

// 详细日志中间件（包含 requestId）
export async function detailedLoggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const log = logger(c);

  // 打印请求日志
  log.start();

  try {
    // 继续处理请求
    await next();

    // 打印响应日志
    const end = Date.now();
    const duration = end - start;
    const status = c.res.status;
    log.end(status, duration);
  } catch (error) {
    // 打印错误日志
    const end = Date.now();
    const duration = end - start;
    log.requestError(error, duration);

    throw error;
  }
}

// JWT 认证中间件
export async function jwtAuthMiddleware(c: Context, next: Next) {
  try {
    // 从 Authorization 头部获取 token
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return honoErrorResponse(
        c,
        "缺少认证信息",
        StatusCode.UNAUTHORIZED,
      );
    }

    // 检查 Bearer 格式
    const match = authHeader.match(/^Bearer\s+(\S+)$/);
    if (!match) {
      return honoErrorResponse(
        c,
        "无效的认证格式",
        StatusCode.UNAUTHORIZED,
      );
    }

    const token = match[1];
    const decoded = await verifyToken(token);

    // 将解码后的用户信息存储到上下文
    c.set("user", decoded);

    await next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Expired")) {
        return honoErrorResponse(
          c,
          "登录已过期，请重新登录",
          StatusCode.UNAUTHORIZED,
        );
      }
      return honoErrorResponse(
        c,
        "无效的token",
        StatusCode.UNAUTHORIZED,
      );
    }

    return honoErrorResponse(
      c,
      "认证失败",
      StatusCode.UNAUTHORIZED,
    );
  }
}
