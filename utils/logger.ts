import type { Context } from "hono";
import { getRequestId } from "../middleware.ts";

// 日志配置接口
interface LogConfig {
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  remoteAddr?: string;
  timestamp?: string;
  status?: number;
  duration?: string;
  contentLength?: string;
  error?: string;
  stack?: string;
}

// 日志级别
type LogLevel = "info" | "error" | "warn" | "debug";

/**
 * 创建基于 Hono Context 的 logger
 * @param c Hono Context 对象
 * @returns 包含格式化日志方法的 logger 对象
 */
export function logger(c: Context) {
  const requestId = getRequestId(c);
  const { method, url } = c.req;
  const userAgent = c.req.header("user-agent") || "-";
  const remoteAddr = c.req.header("x-forwarded-for") || "-";
  const timestamp = new Date().toISOString();

  // 基础日志配置
  const baseConfig: LogConfig = {
    requestId,
    method,
    url,
    userAgent,
    remoteAddr,
    timestamp,
  };

  // 格式化日志消息
  const formatMessage = (
    message: string,
    level: LogLevel = "info",
    config?: LogConfig,
  ) => {
    const finalConfig = { ...baseConfig, ...config };
    const prefix =
      `[${finalConfig.timestamp}] [${finalConfig.requestId}] ${finalConfig.method} ${finalConfig.url}`;

    return {
      message: `${prefix} - ${message}`,
      metadata: finalConfig,
    };
  };

  // 日志输出方法
  const log = (
    level: LogLevel,
    message: string,
    config?: LogConfig,
  ) => {
    const { message: formattedMessage, metadata } = formatMessage(
      message,
      level,
      config,
    );

    switch (level) {
      case "info":
        console.log(formattedMessage, metadata);
        break;
      case "error":
        console.error(formattedMessage, metadata);
        break;
      case "warn":
        console.warn(formattedMessage, metadata);
        break;
      case "debug":
        console.debug(formattedMessage, metadata);
        break;
    }
  };

  return {
    /**
     * 记录请求开始的日志
     */
    start: () => {
      log("info", "START");
    },

    /**
     * 记录响应结束的日志
     * @param status 响应状态码
     * @param duration 响应时间（毫秒）
     */
    end: (status: number, duration: number) => {
      const contentLength = c.res.headers.get("content-length") || "-";
      log("info", `${status} (${duration}ms)`, {
        status,
        duration: `${duration}ms`,
        contentLength,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * 记录请求处理过程中的错误日志
     * @param error 错误对象
     * @param duration 响应时间（毫秒）
     */
    requestError: (error: unknown, duration: number) => {
      log("error", `ERROR (${duration}ms)`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * 通用 info 级别日志
     * @param message 日志消息
     * @param config 额外日志配置
     */
    info: (message: string, config?: LogConfig) => {
      log("info", message, config);
    },

    /**
     * 通用 error 级别日志
     * @param message 日志消息
     * @param config 额外日志配置
     */
    error: (message: string, config?: LogConfig) => {
      log("error", message, config);
    },

    /**
     * 通用 warn 级别日志
     * @param message 日志消息
     * @param config 额外日志配置
     */
    warn: (message: string, config?: LogConfig) => {
      log("warn", message, config);
    },

    /**
     * 通用 debug 级别日志
     * @param message 日志消息
     * @param config 额外日志配置
     */
    debug: (message: string, config?: LogConfig) => {
      log("debug", message, config);
    },
  };
}

// 导出默认 logger 函数
export default logger;
