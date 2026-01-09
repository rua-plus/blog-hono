import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { generateUserToken } from "../utils/jwt.ts";

// 用户数据类型接口
interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  bio: string | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 无密码的用户数据类型接口（用于返回响应）
interface UserWithoutPassword {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 用户创建请求的 Zod 验证 schema
const CreateUserSchema = z.object({
  username: z.string().min(1, "用户名不能为空").max(
    50,
    "用户名长度不能超过50个字符",
  ),
  email: z.email("邮箱格式无效").max(
    100,
    "邮箱长度不能超过100个字符",
  ),
  password: z.union([
    z.string().min(1, "密码不能为空").max(255, "密码长度不能超过255个字符"),
    z.number().min(1, "密码不能为空"),
  ]),
  avatar_url: z.url("头像URL格式无效").optional(),
  bio: z.string().max(500, "个人简介长度不能超过500个字符").optional(),
});

// 用户登录请求的 Zod 验证 schema
const LoginUserSchema = z.object({
  identifier: z.string().min(1, "用户名或邮箱不能为空"), // 支持用户名或邮箱登录
  password: z.union([
    z.string().min(1, "密码不能为空").max(255, "密码长度不能超过255个字符"),
    z.number().min(1, "密码不能为空"),
  ]),
});

export function registerUsers(app: Hono) {
  // 用户登录路由
  app.post(
    "/users/login",
    zValidator("json", LoginUserSchema, (result, c) => {
      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return honoErrorResponse(
          c,
          "请求参数验证失败",
          StatusCode.VALIDATION_ERROR,
          errors,
        );
      }
    }),
    async (c) => {
      try {
        // 获取验证后的请求体
        const body = c.req.valid("json");

        // 根据用户名或邮箱查找用户
        const userResult = await db.queryObject`
          SELECT id, username, email, password_hash, avatar_url, bio, last_login, created_at, updated_at
          FROM users
          WHERE username = ${body.identifier} OR email = ${body.identifier}
        `;

        // 检查用户是否存在
        if (userResult.rows.length === 0) {
          return honoErrorResponse(
            c,
            "用户名或密码错误",
            StatusCode.UNAUTHORIZED,
          );
        }

        const user = userResult.rows[0] as User;

        // 验证密码
        const isPasswordValid = await verifyPassword(
          user.password_hash,
          body.password,
        );

        if (!isPasswordValid) {
          return honoErrorResponse(
            c,
            "用户名或密码错误",
            StatusCode.UNAUTHORIZED,
          );
        }

        // 更新最后登录时间
        const updateResult = await db.queryObject`
          UPDATE users
          SET last_login = NOW()
          WHERE id = ${user.id}
          RETURNING id, username, email, avatar_url, bio, last_login, created_at, updated_at
        `;

        // 移除密码哈希，返回用户信息
        const { password_hash: _password_hash, ...userWithoutPassword } =
          updateResult.rows[0] as User;

        // 生成 JWT
        const token = await generateUserToken(
          userWithoutPassword.id,
          userWithoutPassword.username,
          userWithoutPassword.email,
        );

        // 返回成功响应，包含用户信息和 token
        return honoSuccessResponse(
          c,
          {
            user: userWithoutPassword,
            token,
          },
          "登录成功",
          StatusCode.SUCCESS,
        );
      } catch (error) {
        // 处理错误
        return honoErrorResponse(
          c,
          "服务器内部错误",
          StatusCode.INTERNAL_ERROR,
          undefined,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  // 用户创建路由
  app.post(
    "/users/create",
    zValidator("json", CreateUserSchema, (result, c) => {
      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return honoErrorResponse(
          c,
          "请求参数验证失败",
          StatusCode.VALIDATION_ERROR,
          errors,
        );
      }
    }),
    async (c) => {
      try {
        // 获取验证后的请求体
        const body = c.req.valid("json");

        // 密码哈希
        const password_hash = await hashPassword(body.password.toString());

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
    },
  );
}
