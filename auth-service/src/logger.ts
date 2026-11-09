import { pino } from "pino";

// JSON logs in production (for log collectors), pretty logs in development.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "auth-service" },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never write secrets to the logs.
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "*.password", "token", "*.token"],
    censor: "[redacted]",
  },
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" } },
});

// One log line per HTTP request. Reuses an incoming x-request-id (or creates one)
// so a single request can be followed across services.
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) =>
    err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
});
