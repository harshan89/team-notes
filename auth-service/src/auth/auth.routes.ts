import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/auth/token", authController.issueToken);
authRouter.get("/.well-known/jwks.json", authController.jwks);
