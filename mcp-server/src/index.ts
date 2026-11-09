import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearer } from "./auth.js";
import { httpLogger, logger } from "./logger.js";
import { buildMcpServer } from "./mcp.js";

const PORT = Number(process.env.PORT) || 5000;

const app = express();
app.use(httpLogger);
app.use(express.json());

// Every MCP request must carry the user's token (Authorization: Bearer <token>).
// Stateless mode: a fresh server + transport per request, bound to that token.
app.post("/mcp", requireBearer, async (req, res) => {
  const server = buildMcpServer(req.log, res.locals.token, res.locals.claims, String(req.id));
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  req.log.debug({ method: req.body?.method }, "MCP request");
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Stateless server: no SSE stream or sessions to open/close.
app.all("/mcp", (_req, res) => res.status(405).json({ error: "method not allowed" }));

app.listen(PORT, () => logger.info({ port: PORT }, "MCP server started"));
