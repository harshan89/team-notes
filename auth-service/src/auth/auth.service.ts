import jwt from "jsonwebtoken";
import { getSigningKey } from "../keys/signing-key.js";

export const authService = {
  issueToken(teamId: string, role: string) {
    const key = getSigningKey();

    return jwt.sign(
      {
        teamId,
        role,
      },
      key.privateKey,
      {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
        audience: "notes-service",
        keyid: key.kid, // lets verifiers pick the matching key from the JWKS
      },
    );
  },

  getJwks() {
    return { keys: [getSigningKey().publicJwk] };
  },
};
