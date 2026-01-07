import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { hashPassword } from "../utils/password.ts";

// 用户创建请求的 Zod 验证 schema
const CreateUserSchema = z.object({
  username: z.string().min(1, "用户名不能为空").max(
    50,
    "用户名长度不能超过50个字符",
  ),
  email: z.string().min(1, "邮箱不能为空").email("邮箱格式无效").max(
    100,
    "邮箱长度不能超过100个字符",
  ),
  password: z.string().min(1, "密码不能为空").max(
    255,
    "密码长度不能超过255个字符",
  ),
  avatar_url: z.string().url("头像URL格式无效").optional(),
  bio: z.string().max(500, "个人简介长度不能超过500个字符").optional(),
});

export function registerUsers(app: Hono) {
  app.post("/users", zValidator("json", CreateUserSchema), async (c) => {
    try {
      // 获取验证后的请求体
      const body = c.req.valid("json");

      // 密码哈希
      const password_hash = await hashPassword(body.password);

      // 插入用户到数据库
      const result = await db.queryObject`
        INSERT INTO users (username, email, password_hash, avatar_url, bio)
        VALUES (${body.username}, ${body.email}, ${password_hash}, ${body.avatar_url}, ${body.bio})
        RETURNING id, username, email, avatar_url, bio, last_login, created_at, updated_at
      `;

      // 检查是否插入成功
      if (result.rows.length === 0) {
        return honoErrorResponse(
          c,
          "用户创建失败",
          StatusCode.INTERNAL_ERROR,
        );
      }

      // 返回成功响应
      return honoSuccessResponse(
        c,
        result.rows[0],
        "用户创建成功",
        StatusCode.CREATED,
      );
    } catch (error) {
      // 处理数据库唯一性约束错误
      if (
        error instanceof Error &&
        (error.message.includes(
          "duplicate key value violates unique constraint",
        ) || error.message.includes("users_username_key") ||
          error.message.includes("users_email_key"))
      ) {
        return honoErrorResponse(
          c,
          "用户名或邮箱已存在",
          StatusCode.DUPLICATE_RESOURCE,
        );
      }

      // 处理其他错误
      return honoErrorResponse(
        c,
        "服务器内部错误",
        StatusCode.INTERNAL_ERROR,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  });
}
