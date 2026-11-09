import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { TestDataSource } from "../src/database/data-source";
import { Note } from "../src/entity/Note";
import { signToken, startFakeAuth, stopFakeAuth } from "./helpers/fake-auth";

beforeAll(async () => {
  await startFakeAuth();
  await TestDataSource.initialize();
});
afterAll(async () => {
  await TestDataSource.destroy();
  await stopFakeAuth();
});
beforeEach(() => TestDataSource.getRepository(Note).clear());

const as = (teamId: string, role: string) => ({ Authorization: `Bearer ${signToken({ teamId, role })}` });
const team1Editor = as("team-1", "editor");
const team2Editor = as("team-2", "editor");

const createNote = (title: string, auth: object) => request(app).post("/notes").set(auth as { Authorization: string }).send({ title });
const listTitles = async (auth: object, q?: string) =>
  (await request(app).get("/notes").set(auth as { Authorization: string }).query(q ? { q } : {})).body.map((n: Note) => n.title).sort();

describe("team access", () => {
  beforeEach(async () => {
    await createNote("Team 1 standup", team1Editor);
    await createNote("Team 2 standup", team2Editor);
  });

  it("saves the creator's teamId on the note", async () => {
    const res = await createNote("Design review", team1Editor);

    expect(res.body.teamId).toBe("team-1");
  });

  it("does not let a viewer create notes", async () => {
    const res = await createNote("Viewer's note", as("team-1", "viewer"));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'viewers can\'t create notes; your role is "viewer"' });
  });

  it("shows editors only their own team's notes", async () => {
    expect(await listTitles(team1Editor)).toEqual(["Team 1 standup"]);
  });

  it("shows viewers only their own team's notes", async () => {
    expect(await listTitles(as("team-2", "viewer"))).toEqual(["Team 2 standup"]);
  });

  it("shows admins every team's notes", async () => {
    expect(await listTitles(as("team-3", "admin"))).toEqual(["Team 1 standup", "Team 2 standup"]);
  });

  it("limits search to the caller's team", async () => {
    expect(await listTitles(team1Editor, "standup")).toEqual(["Team 1 standup"]);
  });

  it.each(["editor", "viewer"])("does not let a %s delete notes, even their own team's", async (role) => {
    const { body: note } = await createNote("Team 1 retro", team1Editor);

    const res = await request(app).delete(`/notes/${note.id}`).set(as("team-1", role));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: `only admins can delete notes; your role is "${role}"` });
  });

  it("gives non-admins the same 403 for a note that does not exist", async () => {
    const res = await request(app).delete("/notes/999").set(team1Editor);

    expect(res.status).toBe(403);
  });

  it("lets an admin delete their own team's note", async () => {
    const { body: note } = await createNote("Team 1 retro", team1Editor);

    const res = await request(app).delete(`/notes/${note.id}`).set(as("team-1", "admin"));

    expect(res.status).toBe(204);
  });

  it("does not let an admin delete another team's note", async () => {
    const { body: note } = await createNote("Team 2 retro", team2Editor);

    const res = await request(app).delete(`/notes/${note.id}`).set(as("team-1", "admin"));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'admins can only delete their own team\'s notes; this note belongs to "team-2"' });
    expect(await listTitles(as("team-2", "viewer"))).toContain("Team 2 retro");
  });

  it("rejects an unknown role with a clear message", async () => {
    const res = await request(app).get("/notes").set(as("team-1", "superuser"));

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('role "superuser" is not allowed; expected one of admin, editor, viewer');
  });
});
