import type { UserRole } from "../../generated/prisma/enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: UserRole;
      };
    }
  }
}

export {};
