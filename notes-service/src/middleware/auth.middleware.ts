import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

const ISSUER = "auth-service";
const AUDIENCE = "notes-service";
const ROLES = ["admin", "editor", "viewer"];

// Created on first use so JWKS_URL can be set after import (e.g. in tests).
let client: JwksClient | undefined;
const getClient = () =>
  (client ??= jwksClient({
    jwksUri: process.env.JWKS_URL ?? "http://localhost:4000/.well-known/jwks.json",
    cache: true, // keep public keys in memory
    cacheMaxAge: 10 * 60 * 1000, // re-fetch keys at most every 10 minutes
    rateLimit: true, // tokens with unknown kids can't flood the auth service
    jwksRequestsPerMinute: 10,
    timeout: 5000,
  }));

export interface AuthUser {
  teamId: string;
  role: string;
}

/**
 * Requires a valid RS256 JWT from the auth service:
 *   Authorization: Bearer <token>
 * Checks signature (key picked by the token's kid), expiry, issuer and audience.
 * On success, the caller is available as req.user.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    req.log.warn("Request rejected: missing bearer token");
    return res.status(401).json({ error: "missing bearer token" });
  }

  const kid = jwt.decode(token, { complete: true })?.header.kid;
  if (!kid) {
    req.log.warn("Request rejected: token has no kid");
    return res.status(401).json({ error: "invalid token" });
  }

  let publicKey: string;
  try {
    publicKey = (await getClient().getSigningKey(kid)).getPublicKey();
  } catch (err) {
    const name = (err as Error).name;
    if (name === "SigningKeyNotFoundError" || name === "JwksRateLimitError") {
      req.log.warn({ kid, reason: name }, "Request rejected: unknown signing key");
      return res.status(401).json({ error: "invalid token" });
    }
    // Auth service unreachable or returned an error: not the caller's fault.
    req.log.error({ err, kid }, "Could not fetch signing keys from auth service");
    return res.status(503).json({ error: "unable to verify token" });
  }

  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"], // never accept "none" or HMAC tokens
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as jwt.JwtPayload;

    if (typeof payload.teamId !== "string" || typeof payload.role !== "string") {
      req.log.warn("Request rejected: token is missing teamId or role");
      return res.status(401).json({ error: "invalid token" });
    }

    if (!ROLES.includes(payload.role)) {
      req.log.warn({ role: payload.role }, "Request rejected: unknown role");
      return res.status(403).json({ error: `role "${payload.role}" is not allowed; expected one of ${ROLES.join(", ")}` });
    }

    req.user = { teamId: payload.teamId, role: payload.role };
    req.log = req.log.child({ teamId: payload.teamId, role: payload.role });
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      req.log.warn("Request rejected: token expired");
      return res.status(401).json({ error: "token expired" });
    }
    req.log.warn({ reason: (err as Error).message }, "Request rejected: invalid token");
    return res.status(401).json({ error: "invalid token" });
  }
}
