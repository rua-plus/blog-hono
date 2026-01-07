import type { Context, Next } from "hono";
import { nanoid } from "@sitnik/nanoid";

// 请求ID中间件
export async function requestIdMiddleware(c: Context, next: Next) {
  // 生成唯一请求ID
  const requestId = nanoid();

  // 将请求ID存储到上下文变量中
  c.set("requestId", requestId);

  // 将请求ID添加到响应头中
  c.res.headers.set("X-Request-ID", requestId);

  // 继续处理下一个中间件或路由
  await next();
}

// 获取请求ID的辅助函数
export function getRequestId(c: Context): string {
  return c.get("requestId") as string;
}
