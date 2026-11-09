import { expect, test } from "@playwright/test";
import { createNoteViaApi, noteCard, signIn, uniqueTitle } from "./helpers";

test.describe("notes UI", () => {
  test("an editor creates a note and it is saved", async ({ page }) => {
    const title = uniqueTitle("Sprint planning");
    await signIn(page, "team-1", "editor");

    await page.getByRole("button", { name: "+ New note" }).click();
    await page.getByPlaceholder(/Meeting title/).fill(title);
    await page.getByPlaceholder(/Decisions, owners/).fill("Release on Friday, Sam owns QA");
    await page.getByRole("button", { name: "Save note" }).click();

    const card = noteCard(page, title);
    await expect(card).toBeVisible();
    await expect(card).toContainText("Team 1");
    await expect(card).toContainText("Release on Friday, Sam owns QA");

    // Still there after a reload and signing in again, so it was stored in the database.
    await page.reload();
    await signIn(page, "team-1", "editor");
    await expect(noteCard(page, title)).toBeVisible();
  });

  test("search shows only matching notes", async ({ page, request }) => {
    const retro = uniqueTitle("Retro");
    const standup = uniqueTitle("Standup");
    await createNoteViaApi(request, "team-3", retro, "What went well");
    await createNoteViaApi(request, "team-3", standup, "Blockers");
    await signIn(page, "team-3", "editor");

    await page.getByPlaceholder("Search notes…").fill(retro);

    await expect(noteCard(page, retro)).toBeVisible();
    await expect(noteCard(page, standup)).toHaveCount(0);
  });

  test("editors and viewers only see their own team's notes", async ({ page, request }) => {
    const team1Note = uniqueTitle("Team 1 secret plan");
    const team2Note = uniqueTitle("Team 2 roadmap");
    await createNoteViaApi(request, "team-1", team1Note);
    await createNoteViaApi(request, "team-2", team2Note);

    await signIn(page, "team-2", "editor");
    await expect(noteCard(page, team2Note)).toBeVisible();
    await expect(noteCard(page, team1Note)).toHaveCount(0);

    await page.getByRole("button", { name: "Switch team" }).click();
    await signIn(page, "team-2", "viewer");
    await expect(noteCard(page, team2Note)).toBeVisible();
    await expect(noteCard(page, team1Note)).toHaveCount(0);
  });

  test("a viewer is read-only", async ({ page, request }) => {
    const title = uniqueTitle("Design review");
    await createNoteViaApi(request, "team-1", title);
    await signIn(page, "team-1", "viewer");

    await expect(noteCard(page, title)).toBeVisible();
    await expect(page.getByText("You have read-only access.")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New note" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
  });

  test("an editor cannot delete notes", async ({ page, request }) => {
    const title = uniqueTitle("Client call");
    await createNoteViaApi(request, "team-1", title);
    await signIn(page, "team-1", "editor");

    await expect(noteCard(page, title)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
  });

  test("an admin sees every team's notes but deletes only their own team's", async ({ page, request }) => {
    const team1Note = uniqueTitle("Team 1 kickoff");
    const team2Note = uniqueTitle("Team 2 kickoff");
    await createNoteViaApi(request, "team-1", team1Note);
    await createNoteViaApi(request, "team-2", team2Note);
    await signIn(page, "team-1", "admin");

    await expect(page.getByText("Showing notes from every team.")).toBeVisible();
    await expect(noteCard(page, team1Note)).toBeVisible();
    await expect(noteCard(page, team2Note)).toBeVisible();
    await expect(page.getByRole("button", { name: `Delete "${team2Note}"` })).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept()); // the "Delete …?" confirm
    await noteCard(page, team1Note).hover();
    await page.getByRole("button", { name: `Delete "${team1Note}"` }).click();

    await expect(noteCard(page, team1Note)).toHaveCount(0);
    await page.reload();
    await signIn(page, "team-1", "admin");
    await expect(noteCard(page, team2Note)).toBeVisible();
    await expect(noteCard(page, team1Note)).toHaveCount(0);
  });

  test("switching team goes back to the sign-in screen", async ({ page }) => {
    await signIn(page, "team-1", "editor");
    await page.getByRole("button", { name: "Switch team" }).click();
    await expect(page.getByRole("heading", { name: "Who are you today?" })).toBeVisible();
  });
});
