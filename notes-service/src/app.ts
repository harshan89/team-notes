import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi";
import { httpLogger } from "./logger";
import { requireAuth } from "./middleware/auth.middleware";
import { notesRouter } from "./notes/notes.routes";

export const app = express();
app.use(httpLogger);
app.use(express.json());

// All note routes require a valid JWT from the auth service.
app.use("/notes", requireAuth, notesRouter);

// API docs (public): Swagger UI at /docs, raw spec at /docs.json
app.get("/docs.json", (_req, res) => res.json(openApiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
