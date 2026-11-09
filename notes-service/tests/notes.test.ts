import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { TestDataSource } from "../src/database/data-source";
import { Note } from "../src/entity/Note";
import { signToken, startFakeAuth, stopFakeAuth } from "./helpers/fake-auth";

// Under Vitest the app uses TestDataSource (in-memory), so tests never touch notes.sqlite.
beforeAll(async () => {
  await startFakeAuth();
  await TestDataSource.initialize();
});
afterAll(async () => {
  await TestDataSource.destroy();
  await stopFakeAuth();
});
beforeEach(() => TestDataSource.getRepository(Note).clear());

// Every /notes request needs a valid JWT.
const auth = { Authorization: `Bearer ${signToken()}` };
const adminAuth = { Authorization: `Bearer ${signToken({ teamId: "team-1", role: "admin" })}` };

const createNote = (body: object) => request(app).post("/notes").set(auth).send(body);

describe("POST /notes", () => {
  it("creates a note", async () => {
    const res = await createNote({ title: "Weekly sync", content: "Agreed on release date and owners" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), title: "Weekly sync", content: "Agreed on release date and owners" });
  });

  it("defaults content to an empty string", async () => {
    const res = await createNote({ title: "Design review" });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe("");
  });

  it("rejects a note without a title", async () => {
    const res = await createNote({ content: "Action items with no meeting title" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });
});

describe("GET /notes", () => {
  it("returns an empty list when there are no notes", async () => {
    const res = await request(app).get("/notes").set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("lists all notes", async () => {
    await createNote({ title: "Monday standup" });
    await createNote({ title: "Tuesday standup" });

    const res = await request(app).get("/notes").set(auth);

    expect(res.body.map((n: Note) => n.title).sort()).toEqual(["Monday standup", "Tuesday standup"]);
  });

  it("searches by title or content with ?q=", async () => {
    await createNote({ title: "Sprint planning", content: "Follow up on retro action items" });
    await createNote({ title: "Retro notes", content: "What went well and what to improve" });
    await createNote({ title: "Client call", content: "Reviewed project timeline" });

    const res = await request(app).get("/notes").set(auth).query({ q: "retro" });

    expect(res.body.map((n: Note) => n.title).sort()).toEqual(["Retro notes", "Sprint planning"]);
  });
});

describe("DELETE /notes/:id", () => {
  it("deletes a note", async () => {
    const { body: note } = await createNote({ title: "Cancelled kickoff meeting" });

    const res = await request(app).delete(`/notes/${note.id}`).set(adminAuth);

    expect(res.status).toBe(204);
    expect((await request(app).get("/notes").set(auth)).body).toEqual([]);
  });

  it("returns 404 for a note that does not exist", async () => {
    const res = await request(app).delete("/notes/999").set(adminAuth);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "note not found" });
  });
});
