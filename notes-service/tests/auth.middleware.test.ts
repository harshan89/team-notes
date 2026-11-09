import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { TestDataSource } from "../src/database/data-source";
import { signToken, startFakeAuth, stopFakeAuth } from "./helpers/fake-auth";

beforeAll(async () => {
  await startFakeAuth();
  await TestDataSource.initialize();
});
afterAll(async () => {
  await TestDataSource.destroy();
  await stopFakeAuth();
});

const getNotes = (authorization?: string) => {
  const req = request(app).get("/notes");
  return authorization ? req.set("Authorization", authorization) : req;
};

describe("JWT middleware on /notes", () => {
  it("allows a request with a valid token", async () => {
    const res = await getNotes(`Bearer ${signToken()}`);

    expect(res.status).toBe(200);
  });

  it("rejects a request without a token", async () => {
    const res = await getNotes();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "missing bearer token" });
  });

  it("rejects a header that is not a Bearer token", async () => {
    const res = await getNotes(`Basic ${signToken()}`);

    expect(res.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await getNotes("Bearer not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "invalid token" });
  });

  it("rejects an expired token", async () => {
    const expired = signToken(undefined, { expiresIn: -10 });

    const res = await getNotes(`Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "token expired" });
  });

  it("rejects a token signed with a different key", async () => {
    const { privateKey: otherKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

    const res = await getNotes(`Bearer ${signToken(undefined, {}, otherKey)}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "invalid token" });
  });

  it("rejects a token with an unknown kid", async () => {
    const res = await getNotes(`Bearer ${signToken(undefined, { keyid: "unknown-key" })}`);

    expect(res.status).toBe(401);
  });

  it("rejects a token for a different audience", async () => {
    const res = await getNotes(`Bearer ${signToken(undefined, { audience: "mcp-service" })}`);

    expect(res.status).toBe(401);
  });

  it("rejects a token from a different issuer", async () => {
    const res = await getNotes(`Bearer ${signToken(undefined, { issuer: "someone-else" })}`);

    expect(res.status).toBe(401);
  });

  it("rejects an HMAC token (algorithm confusion)", async () => {
    const hmac = jwt.sign({ teamId: "team-1", role: "admin" }, "guessable-secret", {
      algorithm: "HS256",
      issuer: "auth-service",
      audience: "notes-service",
      keyid: "test-key",
    });

    const res = await getNotes(`Bearer ${hmac}`);

    expect(res.status).toBe(401);
  });

  it("rejects a valid token that is missing teamId or role", async () => {
    const res = await getNotes(`Bearer ${signToken({ teamId: "team-1" })}`);

    expect(res.status).toBe(401);
  });

  it("keeps the API docs public", async () => {
    const res = await request(app).get("/docs.json");

    expect(res.status).toBe(200);
  });
});
