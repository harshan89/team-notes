// OpenAPI spec shown at /docs.
import { notesPaths, notesSchemas, notesTag } from "./notes.docs";

// Auth service docs, where users get a token (shown as a link).
const AUTH_DOCS_URL = `${process.env.AUTH_PUBLIC_URL ?? "http://localhost:4000"}/docs`;

const errorBody = { type: "object", properties: { error: { type: "string" } } };

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Note Service API",
    version: "1.0.0",
    description:
      "Create, list, search and delete notes.\n\n" +
      `**To try it:** get a token from the [auth service docs](${AUTH_DOCS_URL}) ` +
      "(*Get a token*), then click **Authorize** here and paste it.",
  },
  tags: [notesTag],
  // Every /notes route needs a JWT from the auth service (POST /auth/token).
  security: [{ bearerAuth: [] }],
  paths: notesPaths,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: notesSchemas,
    responses: {
      Unauthorized: {
        description: "Missing, invalid or expired token",
        content: { "application/json": { schema: errorBody, example: { error: "invalid token" } } },
      },
      Error: {
        description: "Error",
        content: { "application/json": { schema: errorBody, example: { error: "title is required" } } },
      },
    },
  },
};
