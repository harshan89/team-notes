import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "pino";
import { z } from "zod";
import type { Claims } from "./auth.js";
import { notesClient, NotesApiError } from "./notes.client.js";

const text = (message: string, isError = false): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError,
});

/** Turns a failed call into a plain-language message the LLM can pass on to the user. */
function friendlyError(err: unknown, action: string, who: string): string {
  if (!(err instanceof NotesApiError)) {
    return `I couldn't ${action} because the notes service can't be reached right now. Please try again in a moment.`;
  }
  switch (err.status) {
    case 401:
      return err.message === "token expired"
        ? `I couldn't ${action} because your access token has expired. Please get a new token (pick your team and role again) and reconnect.`
        : `I couldn't ${action} because your access token is missing or invalid. Please get a new token from the auth service and reconnect.`;
    case 403:
      return `You don't have permission to ${action}. You are signed in as ${who}. Reason: ${err.message}. If this needs to be done, ask someone who has access (an admin of the note's team). (This is a permission issue, so retrying won't help.)`;
    case 404:
      return `I couldn't ${action}: that note doesn't exist. It may have been deleted already.`;
    case 400:
      return `I couldn't ${action}: ${err.message}.`;
    default:
      return `I couldn't ${action} because the notes service ran into a problem (${err.status}). Please try again in a moment.`;
  }
}

/**
 * Exposes the notes-service endpoints as MCP tools.
 * Every call is made with the caller's own token, so the notes service decides
 * what they can see and do (admins: see all teams, create, delete own team's notes; editors: own team + create; viewers: own team, read only).
 */
export function buildMcpServer(log: Logger, token: string, claims: Claims | null, requestId: string): McpServer {
  const server = new McpServer({ name: "notes-mcp", version: "1.0.0" });
  const notes = notesClient(token, requestId);
  const who = claims?.role ? `${claims.role} of ${claims.teamId}` : "an unknown user";

  // Runs a tool: logs it, and returns either the success text or a friendly error.
  async function run(tool: string, action: string, args: object, fn: () => Promise<string>): Promise<CallToolResult> {
    const started = Date.now();
    try {
      const message = await fn();
      log.info({ tool, args, ms: Date.now() - started }, "Tool call succeeded");
      return text(message);
    } catch (err) {
      const status = err instanceof NotesApiError ? err.status : undefined;
      log.warn({ tool, args, status, reason: (err as Error).message, ms: Date.now() - started }, "Tool call failed");
      return text(friendlyError(err, action, who), true);
    }
  }

  server.registerTool(
    "who_am_i",
    { description: "Show which team and role the current user is signed in with, and what they are allowed to do." },
    async () => {
      if (!claims?.role) return text("I can't tell who you are from your token. Please get a new token.", true);
      const scope = {
        admin: "can see notes from every team, create notes, and delete notes of their own team only",
        editor: "can see and create notes for their own team, but cannot delete notes",
        viewer: "can only read notes from their own team; they cannot create or delete notes",
      }[claims.role] ?? "has an unknown role";
      return text(`Signed in as ${who}. This user ${scope}.`);
    },
  );

  server.registerTool(
    "list_notes",
    { description: "List notes, newest first. Admins see every team's notes; editors and viewers only their own team's." },
    async () =>
      run("list_notes", "list notes", {}, async () => {
        const list = await notes.list();
        return list.length ? `Found ${list.length} note(s):\n${JSON.stringify(list, null, 2)}` : "There are no notes yet.";
      }),
  );

  server.registerTool(
    "search_notes",
    {
      description: "Search notes by text in the title or content. Only searches notes the user is allowed to see.",
      inputSchema: { query: z.string().min(1).describe("Text to look for") },
    },
    async ({ query }) =>
      run("search_notes", `search notes for "${query}"`, { query }, async () => {
        const list = await notes.list(query);
        return list.length
          ? `Found ${list.length} note(s) matching "${query}":\n${JSON.stringify(list, null, 2)}`
          : `No notes match "${query}".`;
      }),
  );

  server.registerTool(
    "create_note",
    {
      description: "Create a new note for the user's team. Admins and editors only; viewers are read-only and will get a permission error.",
      inputSchema: {
        title: z.string().min(1).describe("Short title, e.g. 'Sprint 14 planning'"),
        content: z.string().optional().describe("Details: decisions, owners, action items"),
      },
    },
    // Only log the title; note content may be private.
    async ({ title, content }) =>
      run("create_note", "create the note", { title }, async () => {
        const note = await notes.create(title, content);
        return `Created note #${note.id} "${note.title}" for ${note.teamId}.`;
      }),
  );

  server.registerTool(
    "delete_note",
    {
      description: "Delete a note by id. Only admins can delete, and only notes of their own team; anything else gets a permission error.",
      inputSchema: { id: z.number().int().describe("The note's id") },
    },
    async ({ id }) =>
      run("delete_note", `delete note #${id}`, { id }, async () => {
        await notes.remove(id);
        return `Deleted note #${id}.`;
      }),
  );

  return server;
}
