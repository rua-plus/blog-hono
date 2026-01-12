import { Hono } from "hono";
import { cors } from "hono/cors";
import { connectDB } from "./utils/db.ts";
import { registerRoutes } from "./routes/index.ts";
import { detailedLoggerMiddleware, requestIdMiddleware } from "./middleware.ts";
import { parseConfigFile } from "./utils/config.ts";

const app = new Hono();
export const config = parseConfigFile("./config.json");

// 启用 CORS 中间件，允许所有跨域请求
app.use("*", cors());

// 启用请求ID中间件
app.use("*", requestIdMiddleware);

// 启用详细日志中间件（包含 requestId）
app.use("*", detailedLoggerMiddleware);

registerRoutes(app);

// Connect to PostgreSQL when starting the application
connectDB().catch((error) => {
  console.error("Failed to start the application:", error);
  Deno.exit(1);
});

Deno.serve(app.fetch);
