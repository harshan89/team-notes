import { Like } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Note } from "../entity/Note";

const repo = () => AppDataSource.getRepository(Note);

export const notesService = {
  create(title: string, content = "", teamId: string) {
    return repo().save(repo().create({ title, content, teamId }));
  },

  // teamId undefined = all teams (admin)
  list(q?: string, teamId?: string) {
    const team = teamId ? { teamId } : {};
    return repo().find({
      where: q ? [{ ...team, title: Like(`%${q}%`) }, { ...team, content: Like(`%${q}%`) }] : team,
      order: { createdAt: "DESC" },
    });
  },

  find(id: number) {
    return repo().findOneBy({ id });
  },

  async remove(id: number) {
    const result = await repo().delete(id);
    return !!result.affected;
  },
};
