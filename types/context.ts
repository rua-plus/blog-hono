import type { Context } from "hono";
import type { JWTPayload } from "../utils/jwt.ts";

// 扩展 Hono Context 类型，添加用户属性支持
export interface ContextWithUser extends Context {
  get(key: "user"): JWTPayload;
  set(key: "user", value: JWTPayload): void;
}
