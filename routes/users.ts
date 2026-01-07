import { Hono } from "hono";
import { db } from "../db.ts";
import {
  honoErrorResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { hashPassword } from "../utils/password.ts";

// 用户创建请求接口
interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  avatar_url?: string;
  bio?: string;
}

// 用户验证函数
function validateUser(data: any): data is CreateUserRequest {
  if (
    !data.username || typeof data.username !== "string" ||
    data.username.length > 50
  ) {
    return false;
  }
  if (
    !data.email || typeof data.email !== "string" || data.email.length > 100 ||
    !/^\S+@\S+\.\S+$/.test(data.email)
  ) {
    return false;
  }
  if (
    !data.password || typeof data.password !== "string" ||
    data.password.length > 255
  ) {
    return false;
  }
  if (data.avatar_url && (typeof data.avatar_url !== "string")) {
    return false;
  }
  if (data.bio && (typeof data.bio !== "string")) {
    return false;
  }
  return true;
}

export function registerUsers(app: Hono) {
  app.post("/users", async (c) => {
    try {
      // 获取请求体
      const body = await c.req.json();

      // 验证请求参数
      if (!validateUser(body)) {
        return honoErrorResponse(
          c,
          "参数验证失败，请检查输入的字段",
          StatusCode.VALIDATION_ERROR,
          [
            {
              field: "username",
              message: "用户名必须是字符串，长度不超过50个字符",
            },
            { field: "email", message: "邮箱必须是有效的电子邮件地址" },
            {
              field: "password",
              message: "密码必须是字符串，长度不超过255个字符",
            },
          ],
        );
      }

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
