import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { connectDB } from "./db.ts";
import { registerRoutes } from "./routes/index.ts";
import { requestIdMiddleware } from "./middleware.ts";

const app = new Hono();

// 启用 CORS 中间件，允许所有跨域请求
app.use("*", cors());

// 启用请求ID中间件
app.use("*", requestIdMiddleware);

// 启用 logger 中间件
app.use("*", logger());

registerRoutes(app);

// Connect to PostgreSQL when starting the application
connectDB().catch((error) => {
  console.error("Failed to start the application:", error);
  Deno.exit(1);
});

Deno.serve(app.fetch);
