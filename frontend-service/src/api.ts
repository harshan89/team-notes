// Calls go through the Vite proxy (see vite.config.ts):
//   /api/auth/*  -> auth-service
//   /api/notes/* -> notes-service

export const TEAMS = ["team-1", "team-2", "team-3"] as const;
export const ROLES = ["admin", "editor", "viewer"] as const;
export type Team = (typeof TEAMS)[number];
export type Role = (typeof ROLES)[number];

export interface Note {
  id: number;
  title: string;
  content: string;
  teamId: string;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  getToken: (teamId: Team, role: Role) =>
    request<{ token: string }>("/api/auth/token", { method: "POST", body: JSON.stringify({ teamId, role }) }),

  listNotes: (token: string, q = "") =>
    request<Note[]>(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`, {}, token),

  createNote: (token: string, title: string, content: string) =>
    request<Note>("/api/notes", { method: "POST", body: JSON.stringify({ title, content }) }, token),

  deleteNote: (token: string, id: number) => request<void>(`/api/notes/${id}`, { method: "DELETE" }, token),
};

/** Reads the expiry from a JWT (no verification; the services do that). */
export function tokenExpiry(token: string): number {
  const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  return payload.exp * 1000;
}
