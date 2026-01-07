import { Hono } from "hono";

export function registerUsers(app: Hono) {
  app.post("/users", async (c) => {
  });
}
