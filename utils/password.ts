import { hash, Variant, verify, Version } from "@felix/argon2";

/**
 * 哈希密码
 * @param password 原始密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await hash(password, {
      variant: Variant.Argon2id,
      memoryCost: 19456, // 19 MiB 内存（以 KB 为单位）
      timeCost: 2, // 迭代次数为 2
      lanes: 1, // 并行度为 1
      version: Version.V13, // 使用 Argon2 版本 19 (对应 V13 枚举值)
    });
    return hashedPassword;
  } catch (error) {
    console.error("密码哈希失败:", error);
    throw new Error("密码哈希失败");
  }
}

/**
 * 验证密码
 * @param hash 哈希后的密码
 * @param password 原始密码
 * @returns 是否验证成功
 */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    const isValid = await verify(hash, password);
    return isValid;
  } catch (error) {
    console.error("密码验证失败:", error);
    throw new Error("密码验证失败");
  }
}
