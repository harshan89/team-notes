// OpenAPI spec shown at /docs.
import { authPaths, authSchemas, authTag } from "./auth.docs.js";

const errorBody = { type: "object", properties: { error: { type: "string" } } };

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description: "Issues RS256 JWTs for the notes service and publishes the public keys to verify them.",
  },
  tags: [authTag],
  paths: authPaths,
  components: {
    schemas: authSchemas,
    responses: {
      Error: {
        description: "Error",
        content: {
          "application/json": { schema: errorBody, example: { error: "teamId and role are required" } },
        },
      },
    },
  },
};
