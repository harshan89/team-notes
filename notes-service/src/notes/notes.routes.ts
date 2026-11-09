import { Router } from "express";
import { notesController } from "./notes.controller";

export const notesRouter = Router();

notesRouter.post("/", notesController.create);
notesRouter.get("/", notesController.list);
notesRouter.delete("/:id", notesController.remove);
