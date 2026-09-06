import type { UserRole } from "../../../generated/prisma/enums.js";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export type CreateUserInput = RegisterInput & { role: UserRole };

export type LoginInput = {
  email: string;
  password: string;
};
