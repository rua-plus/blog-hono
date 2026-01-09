import { assertEquals, assertRejects } from "$std/assert";
import { generateToken, verifyToken, generateUserToken } from "../utils/jwt.ts";

Deno.test("JWT - generate and verify token with custom payload", async () => {
  const payload = {
    id: "user-123",
    username: "johndoe",
    email: "john@example.com",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const token = await generateToken(payload);
  const decoded = await verifyToken(token);

  assertEquals(decoded.id, payload.id);
  assertEquals(decoded.username, payload.username);
  assertEquals(decoded.email, payload.email);
  assertEquals(decoded.role, payload.role);
  assertEquals(decoded.exp, payload.exp);
});

Deno.test("JWT - verifyToken rejects expired token", async () => {
  const payload = {
    id: "user-123",
    username: "johndoe",
    email: "john@example.com",
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
  };

  const token = await generateToken(payload);

  await assertRejects(
    async () => await verifyToken(token),
    Error,
    "expired"
  );
});

Deno.test("JWT - verifyToken rejects invalid token format", async () => {
  const invalidTokens = [
    "invalid.token.here",
    "not-a-token",
    "",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-signature",
  ];

  for (const token of invalidTokens) {
    await assertRejects(
      async () => await verifyToken(token),
      Error
    );
  }
});

Deno.test("JWT - generateUserToken creates token with correct user data", async () => {
  const userId = "user-456";
  const username = "janedoe";
  const email = "jane@example.com";

  const token = await generateUserToken(userId, username, email);
  const decoded = await verifyToken(token);

  assertEquals(decoded.id, userId);
  assertEquals(decoded.username, username);
  assertEquals(decoded.email, email);
  assertEquals(typeof decoded.exp, "number");

  // Check that expiration is in the future (7 days from config)
  const now = Math.floor(Date.now() / 1000);
  assertEquals(decoded.exp > now, true);

  // Check that expiration is approximately 7 days from now (with 1 minute tolerance)
  const expectedExp = now + (7 * 24 * 60 * 60); // 7 days in seconds
  const tolerance = 60; // 1 minute
  assertEquals(Math.abs(decoded.exp - expectedExp) <= tolerance, true);
});

Deno.test("JWT - generateUserToken creates token with unique payload for different users", async () => {
  const token1 = await generateUserToken("user-1", "alice", "alice@example.com");
  const token2 = await generateUserToken("user-2", "bob", "bob@example.com");

  const decoded1 = await verifyToken(token1);
  const decoded2 = await verifyToken(token2);

  assertEquals(decoded1.id, "user-1");
  assertEquals(decoded1.username, "alice");
  assertEquals(decoded1.email, "alice@example.com");

  assertEquals(decoded2.id, "user-2");
  assertEquals(decoded2.username, "bob");
  assertEquals(decoded2.email, "bob@example.com");

  // Tokens should be different
  assertEquals(token1 === token2, false);
});

Deno.test("JWT - token verification maintains all payload fields", async () => {
  const complexPayload = {
    id: "user-789",
    username: "complexuser",
    email: "complex@example.com",
    role: "editor",
    permissions: ["read", "write", "delete"],
    metadata: {
      lastLogin: "2024-01-01",
      ipAddress: "192.168.1.1",
    },
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const token = await generateToken(complexPayload);
  const decoded = await verifyToken(token);

  assertEquals(decoded.id, complexPayload.id);
  assertEquals(decoded.username, complexPayload.username);
  assertEquals(decoded.email, complexPayload.email);
  assertEquals(decoded.role, complexPayload.role);
  assertEquals(decoded.permissions, complexPayload.permissions);
  assertEquals(decoded.metadata, complexPayload.metadata);
  assertEquals(decoded.exp, complexPayload.exp);
});
