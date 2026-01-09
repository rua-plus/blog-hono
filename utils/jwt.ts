import { sign, verify } from "hono/jwt";
import config from "../config.json" with { type: "json" };

// JWT 配置类型
interface JwtConfig {
  secret: string;
  expiresIn: string;
}

// JWT 负载类型
interface JWTPayload {
  id: string;
  username: string;
  email: string;
  exp: number;
  [key: string]: unknown;
}

// 获取 JWT 配置
const jwtConfig: JwtConfig = config.jwt;

// 生成 JWT
export async function generateToken(payload: JWTPayload): Promise<string> {
  return await sign(payload, jwtConfig.secret, "HS256");
}

// 验证 JWT
export async function verifyToken(token: string): Promise<JWTPayload> {
  return await verify(token, jwtConfig.secret) as JWTPayload;
}

// 生成用户认证 token
export async function generateUserToken(
  userId: string,
  username: string,
  email: string,
): Promise<string> {
  const payload = {
    id: userId,
    username,
    email,
    exp: Math.floor(Date.now() / 1000) +
      getExpirationSeconds(jwtConfig.expiresIn),
  };
  return await generateToken(payload);
}

// 解析过期时间字符串（如 "7d"、"1h"、"30m"）为秒数
function getExpirationSeconds(expiresIn: string): number {
  const units: Record<string, number> = {
    "s": 1,
    "m": 60,
    "h": 3600,
    "d": 86400,
    "w": 604800,
  };

  const match = expiresIn.match(/^(\d+)([smhdw])?$/);
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || "s"; // 默认秒

  if (!units[unit]) {
    throw new Error(`Invalid time unit: ${unit}`);
  }

  return value * units[unit];
}
