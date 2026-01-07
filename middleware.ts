import type { Context, Next } from "hono";
import { nanoid } from "@sitnik/nanoid";

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
  const requestId = getRequestId(c);
  const { method, url } = c.req;
  const userAgent = c.req.header("user-agent") || "-";
  const remoteAddr = c.req.header("x-forwarded-for") || "-";

  // 打印请求日志
  console.log(
    `[${new Date().toISOString()}] [${requestId}] ${method} ${url} - START`,
    {
      requestId,
      method,
      url,
      userAgent,
      remoteAddr,
      timestamp: new Date().toISOString(),
    },
  );

  try {
    // 继续处理请求
    await next();

    // 打印响应日志
    const end = Date.now();
    const duration = end - start;
    const status = c.res.status;
    const contentLength = c.res.headers.get("content-length") || "-";

    console.log(
      `[${new Date().toISOString()}] [${requestId}] ${method} ${url} - ${status} (${duration}ms)`,
      {
        requestId,
        method,
        url,
        status,
        duration: `${duration}ms`,
        contentLength,
        userAgent,
        remoteAddr,
        timestamp: new Date().toISOString(),
      },
    );
  } catch (error) {
    // 打印错误日志
    const end = Date.now();
    const duration = end - start;

    console.error(
      `[${new Date().toISOString()}] [${requestId}] ${method} ${url} - ERROR (${duration}ms)`,
      {
        requestId,
        method,
        url,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
        userAgent,
        remoteAddr,
        timestamp: new Date().toISOString(),
      },
    );

    throw error;
  }
}
