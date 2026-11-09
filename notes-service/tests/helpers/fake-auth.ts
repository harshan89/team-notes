import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

// A throwaway key pair standing in for the auth service's key.
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
export const KID = "test-key";
const jwks = { keys: [{ ...publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" }] };

let server: Server;

/** Serves the JWKS like the auth service does, and points the notes service at it. */
export async function startFakeAuth() {
  server = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(jwks));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  process.env.JWKS_URL = `http://localhost:${port}/.well-known/jwks.json`;
}

export const stopFakeAuth = () => new Promise((resolve) => server.close(resolve));

/** Signs a token like the auth service does. Override anything to build bad tokens. */
export function signToken(
  claims: object = { teamId: "team-1", role: "editor" },
  options: jwt.SignOptions = {},
  key = privateKey,
) {
  return jwt.sign(claims, key, {
    algorithm: "RS256",
    expiresIn: "1h",
    issuer: "auth-service",
    audience: "notes-service",
    keyid: KID,
    ...options,
  });
}
