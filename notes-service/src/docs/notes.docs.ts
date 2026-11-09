// Swagger docs for the notes endpoints.
// Keep in sync with src/notes/notes.routes.ts.

export const notesTag = { name: "Notes" };

export const notesPaths = {
  "/notes": {
    get: {
      tags: ["Notes"],
      summary: "List notes, or search with ?q=",
      description: "Admins see every team's notes. Editors and viewers see only their own team's.",
      parameters: [
        {
          name: "q",
          in: "query",
          required: false,
          description: "Text to search for in the title or content",
          schema: { type: "string" },
          example: "retro",
        },
      ],
      responses: {
        401: { $ref: "#/components/responses/Unauthorized" },
        200: {
          description: "Notes, newest first",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/Note" } },
            },
          },
        },
      },
    },
    post: {
      tags: ["Notes"],
      summary: "Create a note",
      description: "Admins and editors only. Viewers get 403.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/NewNote" } },
        },
      },
      responses: {
        401: { $ref: "#/components/responses/Unauthorized" },
        201: {
          description: "Note created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Note" } } },
        },
        400: { $ref: "#/components/responses/Error" },
        403: { $ref: "#/components/responses/Error" },
      },
    },
  },
  "/notes/{id}": {
    delete: {
      tags: ["Notes"],
      summary: "Delete a note",
      description: "Admins only, and only notes of their own team. Everyone else gets 403.",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      responses: {
        401: { $ref: "#/components/responses/Unauthorized" },
        204: { description: "Note deleted" },
        403: {
          description: "Caller is not an admin, or the note belongs to another team",
          content: {
            "application/json": {
              examples: {
                notAdmin: { value: { error: 'only admins can delete notes; your role is "editor"' } },
                otherTeam: {
                  value: { error: 'admins can only delete their own team\'s notes; this note belongs to "team-2"' },
                },
              },
            },
          },
        },
        404: { $ref: "#/components/responses/Error" },
      },
    },
  },
};

export const notesSchemas = {
  Note: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      title: { type: "string", example: "Sprint 14 planning" },
      content: { type: "string", example: "Goal: ship login flow. Owners: Alex (API), Sam (UI). Demo on Friday." },
      teamId: { type: "string", example: "team-1", description: "Set from the creator's token" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  NewNote: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", example: "Sprint 14 planning" },
      content: { type: "string", example: "Goal: ship login flow. Owners: Alex (API), Sam (UI). Demo on Friday." },
    },
  },
};
