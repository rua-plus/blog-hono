import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";

Deno.test("Password hashing and verification test", async () => {
  // 测试密码
  const testPassword = "password123";

  // 哈希密码
  const hashedPassword = await hashPassword(testPassword);
  console.log("Hashed password:", hashedPassword);

  // 验证密码
  const isValid = await verifyPassword(hashedPassword, testPassword);
  console.log("Password verification result:", isValid);

  // 断言密码验证成功
  assertEquals(isValid, true);

  // 测试错误密码的验证
  const invalidPassword = "wrongpassword";
  const isInvalid = await verifyPassword(hashedPassword, invalidPassword);
  console.log("Invalid password verification result:", isInvalid);

  // 断言错误密码验证失败
  assertEquals(isInvalid, false);
});
