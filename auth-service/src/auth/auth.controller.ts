import { Request, Response } from "express";
import { ROLES, TEAMS } from "./auth.constants.js";
import { authService } from "./auth.service.js";

export const authController = {
  issueToken(req: Request, res: Response) {
    const { teamId, role } = req.body ?? {};
    if (!teamId || !role) {
      req.log.warn("Token request rejected: teamId and role are required");
      return res.status(400).json({ error: "teamId and role are required" });
    }
    if (!TEAMS.includes(teamId) || !ROLES.includes(role)) {
      req.log.warn({ teamId, role }, "Token request rejected: unknown team or role");
      return res.status(400).json({
        error: `teamId must be one of ${TEAMS.join(", ")} and role one of ${ROLES.join(", ")}`,
      });
    }

    const token = authService.issueToken(teamId, role);
    req.log.info({ teamId, role }, "Token issued");
    res.json({ token });
  },

  jwks(_req: Request, res: Response) {
    res.set("Cache-Control", "public, max-age=300");
    res.json(authService.getJwks());
  },
};
