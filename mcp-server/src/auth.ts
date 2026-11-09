import type { NextFunction, Request, Response } from "express";

/**
 * Requires an `Authorization: Bearer <token>` header and keeps the token on
 * res.locals so tools can pass it on to the notes service.
 *
 * The notes service verifies the token (signature, expiry, team, role), so it is
 * not verified again here. Claims are only decoded for logging and messages.
 */
export function requireBearer(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    req.log.warn("Request rejected: missing bearer token");
    res.setHeader("WWW-Authenticate", "Bearer");
    return res.status(401).json({
      error: "missing bearer token",
      hint: "Get a token from the auth service (POST /auth/token) and send it as 'Authorization: Bearer <token>'.",
    });
  }

  const claims = decodeClaims(token);
  res.locals.token = token;
  res.locals.claims = claims;
  req.log = req.log.child({ teamId: claims?.teamId, role: claims?.role });
  next();
}

export interface Claims {
  teamId?: string;
  role?: string;
}

/** Reads the JWT payload WITHOUT verifying it. Only for logs and friendly messages. */
export function decodeClaims(token: string): Claims | null {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  } catch {
    return null;
  }
}
