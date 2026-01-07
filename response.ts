import type { Context } from "hono";
import { nanoid } from "@sitnik/nanoid";

// 状态码定义
export const enum StatusCode {
  // HTTP状态码
  HTTP_OK = 200,
  HTTP_CREATED = 201,
  HTTP_BAD_REQUEST = 400,
  HTTP_UNAUTHORIZED = 401,
  HTTP_FORBIDDEN = 403,
  HTTP_NOT_FOUND = 404,
  HTTP_INTERNAL_ERROR = 500,

  // 业务成功状态码
  SUCCESS = 200,
  CREATED = 201,
  ACCEPTED = 202,

  // 业务错误状态码（4xxxx）
  BAD_REQUEST = 40000,
  VALIDATION_ERROR = 40001,
  PARAM_ERROR = 40002,

  // 认证授权错误（401xx）
  UNAUTHORIZED = 40100,
  TOKEN_EXPIRED = 40101,
  TOKEN_INVALID = 40102,

  // 权限错误（403xx）
  FORBIDDEN = 40300,
  ACCESS_DENIED = 40301,

  // 资源错误（404xx）
  NOT_FOUND = 40400,
  RESOURCE_NOT_FOUND = 40401,

  // 业务逻辑错误（409xx）
  CONFLICT = 40900,
  DUPLICATE_RESOURCE = 40901,

  // 系统错误（500xx）
  INTERNAL_ERROR = 50000,
  SERVICE_UNAVAILABLE = 50001,
  DATABASE_ERROR = 50002,

  // 第三方服务错误（502xx）
  THIRD_PARTY_ERROR = 50200,
  EXTERNAL_API_ERROR = 50201,
}

// 响应接口定义
interface BaseResponse {
  success: boolean;
  code: StatusCode;
  message: string;
  timestamp: number;
  requestId: string;
}

interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data?: T;
  version?: string;
}

interface ErrorResponse extends BaseResponse {
  success: false;
  errors?: Array<{ field?: string; message: string }>;
  path?: string;
  debug?: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginationResponse<T> extends Omit<SuccessResponse<T>, "data"> {
  data: {
    list: T[];
    pagination: PaginationInfo;
  };
}

// 成功响应
export function successResponse<T>(
  data?: T,
  message: string = "操作成功",
  code: number = StatusCode.SUCCESS,
  version?: string,
  requestId?: string,
): SuccessResponse<T> {
  return {
    success: true,
    code,
    message,
    data,
    timestamp: Date.now(),
    requestId: requestId || nanoid(),
    version,
  };
}

// 错误响应
export function errorResponse(
  message: string,
  code: number = StatusCode.BAD_REQUEST,
  errors?: Array<{ field?: string; message: string }>,
  path?: string,
  debug?: string,
  requestId?: string,
): ErrorResponse {
  return {
    success: false,
    code,
    message,
    errors,
    timestamp: Date.now(),
    requestId: requestId || nanoid(),
    path,
    debug,
  };
}

// 分页响应
export function paginationResponse<T>(
  list: T[],
  pagination: PaginationInfo,
  message: string = "查询成功",
  code: StatusCode = StatusCode.SUCCESS,
  requestId?: string,
): PaginationResponse<T> {
  return {
    success: true,
    code,
    message,
    data: {
      list,
      pagination,
    },
    timestamp: Date.now(),
    requestId: requestId || nanoid(),
  };
}

// Hono 响应辅助函数
export function honoSuccessResponse<T>(
  c: Context,
  data?: T,
  message: string = "操作成功",
  code: StatusCode = StatusCode.SUCCESS,
  version?: string,
) {
  const httpCode = code < 1000 ? code : StatusCode.HTTP_OK;
  const requestId = c.get("requestId") as string;
  return c.json(
    successResponse(data, message, code, version, requestId),
    httpCode as StatusCode.HTTP_OK,
  );
}

export function honoErrorResponse(
  c: Context,
  message: string,
  code: StatusCode = StatusCode.BAD_REQUEST,
  errors?: Array<{ field?: string; message: string }>,
  debug?: string,
) {
  const httpCode = code < 1000 ? code : StatusCode.HTTP_BAD_REQUEST;
  const requestId = c.get("requestId") as string;
  return c.json(
    errorResponse(message, code, errors, c.req.path, debug, requestId),
    httpCode as StatusCode.HTTP_OK,
  );
}

export function honoPaginationResponse<T>(
  c: Context,
  list: T[],
  pagination: PaginationInfo,
  message: string = "查询成功",
  code: StatusCode = StatusCode.SUCCESS,
) {
  const httpCode = code < 1000 ? code : StatusCode.HTTP_OK;
  const requestId = c.get("requestId") as string;
  return c.json(
    paginationResponse(list, pagination, message, code, requestId),
    httpCode as StatusCode.HTTP_OK,
  );
}
