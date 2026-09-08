import { SignJWT } from "jose";
import { prisma } from "../../../lib/prisma.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import type {
  CreateUserInput,
  LoginInput,
  RegisterInput,
} from "./auth.types.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const publicUser = {
  id: true,
  fullName: true,
  email: true,
  role: true,
} as const;

const tokenFor = async (user: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}) =>
  new SignJWT({ email: user.email, fullName: user.fullName, role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);

const createUser = async (input: CreateUserInput) => {
  const user = await prisma.user.create({
    data: {
      ...input,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
    },
    select: publicUser,
  });
  return { user, accessToken: await tokenFor(user) };
};

export const register = (input: RegisterInput) =>
  createUser({ ...input, role: UserRole.MEMBER });

export const createManagedUser = (input: CreateUserInput) => createUser(input);

export const login = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    const error = new Error("Invalid email or password");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
  const safeUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
  return { user: safeUser, accessToken: await tokenFor(safeUser) };
};

export const getCurrentUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUser,
  });
  if (!user) {
    const error = new Error("User not found");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
  return user;
};
