import { AuthUser } from "../middleware/auth.middleware";

// Adds req.user (set by requireAuth) to Express's Request type.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
