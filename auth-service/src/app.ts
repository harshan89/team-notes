import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./auth/auth.routes.js";
import { openApiSpec } from "./docs/openapi.js";
import { httpLogger } from "./logger.js";

// Origin allowed to call this service from a browser.
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const app = express();
app.use(httpLogger);
app.use(cors({ origin: CORS_ORIGIN, methods: ["GET", "POST"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // form posts (Swagger dropdowns)
app.use(authRouter);

// API docs: Swagger UI at /docs, raw spec at /docs.json
app.get("/docs.json", (_req, res) => res.json(openApiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
