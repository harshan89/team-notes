import { createPublicKey, generateKeyPairSync } from "node:crypto";
import { rmSync } from "node:fs";
import { dirname } from "node:path";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { ROLES, TEAMS } from "../src/auth/auth.constants";
import { PRIVATE_KEY_PATH } from "../src/keys/generate-keys";
import { initSigningKey } from "../src/keys/signing-key";

beforeAll(() => initSigningKey());
afterAll(() => rmSync(dirname(PRIVATE_KEY_PATH), { recursive: true, force: true }));

const getToken = (body: object) => request(app).post("/auth/token").send(body);

describe("POST /auth/token", () => {
  it("returns a token with teamId and role", async () => {
    const res = await getToken({ teamId: "team-1", role: "viewer" });

    expect(res.status).toBe(200);
    expect(jwt.decode(res.body.token)).toMatchObject({
      teamId: "team-1",
      role: "viewer",
      iss: "auth-service",
      aud: "notes-service",
    });
  });

  it("issues a token that verifies with the public key from the JWKS", async () => {
    const { body } = await getToken({ teamId: "team-1", role: "viewer" });
    const { body: jwks } = await request(app).get("/.well-known/jwks.json");
    const publicKey = createPublicKey({ key: jwks.keys[0], format: "jwk" });

    const payload = jwt.verify(body.token, publicKey, {
      algorithms: ["RS256"],
      issuer: "auth-service",
      audience: "notes-service",
    }) as jwt.JwtPayload;

    expect(payload.teamId).toBe("team-1");
    expect(payload.exp! - payload.iat!).toBe(60 * 60); // 1 hour
  });

  it("puts the key id (kid) from the JWKS in the token header", async () => {
    const { body } = await getToken({ teamId: "team-1", role: "viewer" });
    const { body: jwks } = await request(app).get("/.well-known/jwks.json");

    const { header } = jwt.decode(body.token, { complete: true })!;

    expect(header).toMatchObject({ alg: "RS256", kid: jwks.keys[0].kid });
  });

  it("rejects a token signed with a different key", async () => {
    const { body } = await getToken({ teamId: "team-1", role: "viewer" });
    const { publicKey: otherKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

    expect(() => jwt.verify(body.token, otherKey, { algorithms: ["RS256"] })).toThrow(
      "invalid signature",
    );
  });

  it.each([{ role: "viewer" }, { teamId: "team-1" }, {}])(
    "returns 400 when teamId or role is missing: %o",
    async (body) => {
      const res = await getToken(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "teamId and role are required" });
    },
  );

  it.each([
    { teamId: "team-9", role: "viewer" },
    { teamId: "team-1", role: "superuser" },
  ])("returns 400 for an unknown team or role: %o", async (body) => {
    const res = await getToken(body);

    expect(res.status).toBe(400);
  });

  it("accepts a form post (used by the Swagger dropdowns)", async () => {
    const res = await request(app).post("/auth/token").type("form").send({ teamId: "team-2", role: "editor" });

    expect(res.status).toBe(200);
    expect(jwt.decode(res.body.token)).toMatchObject({ teamId: "team-2", role: "editor" });
  });

  it("allows browser calls from the configured origin (CORS)", async () => {
    const res = await getToken({ teamId: "team-1", role: "viewer" });

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });
});

describe("API docs", () => {
  it("serves the spec with the same teams and roles the API accepts", async () => {
    const res = await request(app).get("/docs.json");
    const fields = res.body.components.schemas.TokenRequest.properties;

    expect(res.status).toBe(200);
    expect(fields.teamId.enum).toEqual([...TEAMS]);
    expect(fields.role.enum).toEqual([...ROLES]);
  });
});
