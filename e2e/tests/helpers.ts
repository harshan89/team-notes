import { expect, type APIRequestContext, type Page } from "@playwright/test";

export type Team = "team-1" | "team-2" | "team-3";
export type Role = "admin" | "editor" | "viewer";

const label = { "team-1": "Team 1", "team-2": "Team 2", "team-3": "Team 3" };
const roleTitle = { admin: "Admin", editor: "Editor", viewer: "Viewer" };

/** A title no other test uses, so parallel tests don't see each other's notes by accident. */
export const uniqueTitle = (name: string) => `${name} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Signs in through the UI: pick team + role, generate a token, wait for the notes page. */
export async function signIn(page: Page, team: Team, role: Role) {
  await page.goto("/");
  await page.getByRole("button", { name: label[team] }).click();
  await page.getByRole("button", { name: roleTitle[role] }).click();
  await page.getByRole("button", { name: /Generate token/ }).click();
  await expect(page.getByRole("button", { name: "Switch team" })).toBeVisible();
}

export const noteCard = (page: Page, title: string) => page.locator("article").filter({ hasText: title });

/** Gets a token from the auth service (through the frontend's /api proxy). */
export async function getToken(request: APIRequestContext, teamId: Team, role: Role): Promise<string> {
  const res = await request.post("/api/auth/token", { data: { teamId, role } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

/** Creates a note through the API, to set up data for a UI test. */
export async function createNoteViaApi(request: APIRequestContext, teamId: Team, title: string, content = "") {
  const token = await getToken(request, teamId, "editor");
  const res = await request.post("/api/notes", { data: { title, content }, headers: { authorization: `Bearer ${token}` } });
  expect(res.status()).toBe(201);
  return res.json();
}
