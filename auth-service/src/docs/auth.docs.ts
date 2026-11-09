// Swagger docs for the auth endpoints.
// Keep in sync with src/auth/auth.routes.ts.
import { ROLES, TEAMS } from "../auth/auth.constants.js";

export const authTag = { name: "Auth" };

export const authPaths = {
  "/auth/token": {
    post: {
      tags: ["Auth"],
      summary: "Get a token",
      description: "Copy the `token` and use it as a Bearer token in the notes service.",
      requestBody: {
        required: true,
        content: {
          // Form fields so Swagger shows dropdowns for team and role.
          "application/x-www-form-urlencoded": {
            schema: { $ref: "#/components/schemas/TokenRequest" },
          },
          "application/json": {
            schema: { $ref: "#/components/schemas/TokenRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Signed RS256 JWT, valid for 1 hour",
          content: {
            "application/json": {
              schema: { type: "object", properties: { token: { type: "string" } } },
            },
          },
        },
        400: { $ref: "#/components/responses/Error" },
      },
    },
  },
  "/.well-known/jwks.json": {
    get: {
      tags: ["Auth"],
      summary: "Public keys for verifying tokens (JWKS)",
      responses: {
        200: {
          description: "JSON Web Key Set",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  keys: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        kty: { type: "string", example: "RSA" },
                        kid: { type: "string" },
                        alg: { type: "string", example: "RS256" },
                        use: { type: "string", example: "sig" },
                        n: { type: "string" },
                        e: { type: "string", example: "AQAB" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const authSchemas = {
  TokenRequest: {
    type: "object",
    required: ["teamId", "role"],
    properties: {
      // Read from auth.constants.ts, so the docs always match what the API accepts.
      teamId: { type: "string", enum: [...TEAMS], default: TEAMS[0] },
      role: {
        type: "string",
        enum: [...ROLES],
        default: "viewer",
        description: "admin: all teams, create and delete · editor: own team, create · viewer: own team, read only",
      },
    },
  },
};
