import { Request, Response } from "express";
import { notesService } from "./notes.service";

// Admins see every team's notes; editors and viewers only their own team's.
const teamScope = (req: Request) => (req.user!.role === "admin" ? undefined : req.user!.teamId);

export const notesController = {
  async create(req: Request, res: Response) {
    // Viewers are read-only.
    if (req.user!.role === "viewer") {
      req.log.warn("Create denied: viewers can't create notes");
      return res.status(403).json({ error: `viewers can't create notes; your role is "viewer"` });
    }
    const { title, content } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "title is required" });
    const note = await notesService.create(title, content, req.user!.teamId);
    req.log.info({ noteId: note.id }, "Note created");
    res.status(201).json(note);
  },

  async list(req: Request, res: Response) {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const notes = await notesService.list(q || undefined, teamScope(req));
    req.log.debug({ q: q || undefined, count: notes.length }, "Notes listed");
    res.json(notes);
  },

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    // Checked before looking up the note, so non-admins can't probe which ids exist.
    if (req.user!.role !== "admin") {
      req.log.warn({ noteId: id }, "Delete denied: only admins can delete notes");
      return res.status(403).json({ error: `only admins can delete notes; your role is "${req.user!.role}"` });
    }
    const note = await notesService.find(id);
    if (!note) {
      req.log.warn({ noteId: id }, "Delete failed: note not found");
      return res.status(404).json({ error: "note not found" });
    }
    // Admins can see every team's notes, but only delete their own team's.
    if (note.teamId !== req.user!.teamId) {
      req.log.warn({ noteId: id, noteTeamId: note.teamId }, "Delete denied: note belongs to another team");
      return res.status(403).json({
        error: `admins can only delete their own team's notes; this note belongs to "${note.teamId}"`,
      });
    }
    await notesService.remove(id);
    req.log.info({ noteId: id }, "Note deleted");
    res.status(204).send();
  },
};
