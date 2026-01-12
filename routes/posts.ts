import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db.ts";
import {
  honoErrorResponse,
  honoPaginationResponse,
  honoSuccessResponse,
  StatusCode,
} from "../response.ts";
import { jwtAuthMiddleware } from "../middleware.ts";
import type { ContextWithUser } from "../types/context.ts";

// 文章数据类型接口（与数据库表结构匹配）
interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: number;
  status: "draft" | "published" | "archived";
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 文章列表查询结果接口（包含作者信息）
interface PostWithAuthor extends Post {
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  author_bio: string | null;
}

// 文章列表查询参数的 Zod 验证 schema
const ListPostsSchema = z.object({
  page: z.string().transform(Number).optional().default(1),
  pageSize: z.string().transform(Number).optional().default(10),
  startDate: z.string().optional(), // 格式: YYYY-MM-DD
  endDate: z.string().optional(), // 格式: YYYY-MM-DD
  status: z.string().optional(), // 可选的状态筛选: draft, published, archived
});

// 文章详情查询参数的 Zod 验证 schema
const GetPostSchema = z.object({
  postId: z.string().transform(Number), // 文章ID，转换为数字类型
});

// 创建文章请求的 Zod 验证 schema
const CreatePostSchema = z.object({
  title: z.string().min(1, "文章标题不能为空").max(
    200,
    "文章标题长度不能超过200个字符",
  ),
  slug: z.string().min(1, "URL标识不能为空").max(
    200,
    "URL标识长度不能超过200个字符",
  ),
  content: z.string().min(1, "文章内容不能为空"),
  excerpt: z.string().max(500, "文章摘要长度不能超过500个字符").optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().optional(), // ISO 日期时间格式
});

export function registerPosts(app: Hono) {
  // 创建文章路由（需要 JWT 登录验证）
  app.post(
    "/posts/create",
    jwtAuthMiddleware, // 使用 JWT 认证中间件
    zValidator("json", CreatePostSchema, (result, c) => {
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
        // 获取当前登录用户信息
        const user = (c as unknown as ContextWithUser).get("user");
        if (!user || !user.id) {
          return honoErrorResponse(
            c,
            "用户信息获取失败",
            StatusCode.UNAUTHORIZED,
          );
        }

        // 获取验证后的请求体
        const body = c.req.valid("json");

        // 处理发布时间
        let publishedAt = null;
        if (body.status === "published") {
          publishedAt = body.published_at
            ? new Date(body.published_at)
            : new Date();
        }

        // 插入文章到数据库
        const result = await db.queryObject`
          INSERT INTO posts (title, slug, content, excerpt, author_id, status, published_at)
          VALUES (${body.title}, ${body.slug}, ${body.content}, ${body.excerpt}, ${
          parseInt(user.id)
        }, ${body.status}, ${publishedAt})
          RETURNING id, title, slug, content, excerpt, author_id, status, published_at, created_at, updated_at
        `;

        // 检查是否插入成功
        if (result.rows.length === 0) {
          return honoErrorResponse(
            c,
            "文章创建失败",
            StatusCode.INTERNAL_ERROR,
          );
        }

        // 返回成功响应
        return honoSuccessResponse(
          c,
          result.rows[0],
          "文章创建成功",
          StatusCode.CREATED,
        );
      } catch (error) {
        // 处理数据库唯一性约束错误（slug 已存在）
        if (
          error instanceof Error &&
          (error.message.includes(
            "duplicate key value violates unique constraint",
          ) ||
            error.message.includes("posts_slug_key"))
        ) {
          return honoErrorResponse(
            c,
            "URL标识已存在",
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

  // 获取单个文章详情路由
  app.get(
    "/posts/:postId",
    zValidator("param", GetPostSchema, (result, c) => {
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
        // 获取验证后的路径参数
        const { postId } = c.req.valid("param");

        // 查询文章详情（包含完整内容和作者信息）
        const query = `
          SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.author_id, p.status, p.published_at, p.created_at, p.updated_at,
                 u.username as author_name, u.email as author_email, u.avatar_url as author_avatar, u.bio as author_bio
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id
          WHERE p.id = $1
        `;

        const result = await db.queryObject<PostWithAuthor>({
          text: query,
          args: [postId],
        });

        // 检查文章是否存在
        if (result.rows.length === 0) {
          return honoErrorResponse(
            c,
            "文章不存在",
            StatusCode.RESOURCE_NOT_FOUND,
          );
        }

        // 返回文章详情
        return honoSuccessResponse(
          c,
          result.rows[0],
          "文章详情查询成功",
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

  // 列出文章路由（含分页和日期筛选）
  app.get(
    "/posts/list",
    zValidator("query", ListPostsSchema, (result, c) => {
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
        // 获取验证后的查询参数
        const query = c.req.valid("query");
        const page = Number(query.page);
        const pageSize = Number(query.pageSize);
        const offset = (page - 1) * pageSize;

        // 构建基础查询
        const baseQuery = `
          SELECT p.id, p.title, p.slug, p.excerpt, p.author_id, p.status, p.created_at, p.updated_at,
                 u.username as author_name, u.email as author_email, u.avatar_url as author_avatar, u.bio as author_bio
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id
        `;
        const conditions: string[] = [];
        const params: (string | number)[] = [];
        let paramIndex = 1;

        // 添加状态筛选条件
        if (query.status) {
          conditions.push(`p.status = $${paramIndex++}`);
          params.push(query.status);
        }

        // 添加日期范围筛选条件
        if (query.startDate && query.endDate) {
          conditions.push(
            `p.created_at BETWEEN $${paramIndex++} AND $${paramIndex++}`,
          );
          params.push(`${query.startDate} 00:00:00`);
          params.push(`${query.endDate} 23:59:59`);
        } else if (query.startDate) {
          conditions.push(`p.created_at >= $${paramIndex++}`);
          params.push(`${query.startDate} 00:00:00`);
        } else if (query.endDate) {
          conditions.push(`p.created_at <= $${paramIndex++}`);
          params.push(`${query.endDate} 23:59:59`);
        }

        // 构建完整查询
        const whereClause = conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";
        const postsQuery =
          `${baseQuery} ${whereClause} ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const countQuery =
          `SELECT COUNT(*) as total FROM posts p ${whereClause}`;

        // 添加分页参数
        params.push(pageSize, offset);

        // 执行查询
        const postsResult = await db.queryObject<PostWithAuthor>({
          text: postsQuery,
          args: params,
        });
        const countResult = await db.queryObject<{ total: string }>({
          text: countQuery,
          args: params.slice(0, -2),
        });

        // 计算分页信息
        const total = Number(countResult.rows[0].total);
        const totalPages = Math.ceil(total / pageSize);

        // 返回分页响应
        return honoPaginationResponse(
          c,
          postsResult.rows as PostWithAuthor[],
          {
            page,
            pageSize,
            total,
            totalPages,
          },
          "文章列表查询成功",
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
}
