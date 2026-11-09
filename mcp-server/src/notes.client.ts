const NOTE_SERVICE_URL = process.env.NOTE_SERVICE_URL ?? "http://localhost:3000";

export interface Note {
  id: number;
  title: string;
  content: string;
  teamId: string;
  createdAt: string;
}

/** An error response from the notes service (status + its error message). */
export class NotesApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(token: string, requestId: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTE_SERVICE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      // Pass the caller's token on; the notes service checks it.
      authorization: `Bearer ${token}`,
      // Same id as the incoming MCP request, so logs can be joined across services.
      "x-request-id": requestId,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new NotesApiError(res.status, body.error ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function notesClient(token: string, requestId: string) {
  return {
    create: (title: string, content?: string) =>
      request<Note>(token, requestId, "/notes", { method: "POST", body: JSON.stringify({ title, content }) }),

    list: (q?: string) =>
      request<Note[]>(token, requestId, q ? `/notes?q=${encodeURIComponent(q)}` : "/notes"),

    remove: (id: number) => request<void>(token, requestId, `/notes/${id}`, { method: "DELETE" }),
  };
}
