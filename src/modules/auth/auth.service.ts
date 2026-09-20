import { SignJWT } from "jose";
import { prisma } from "../../../lib/prisma.js";
import type { UserRole } from "../../../generated/prisma/enums.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import type {
  AssignRoleInput,
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
  role: UserRole | null;
}) =>
  new SignJWT({ email: user.email, fullName: user.fullName, role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);

const createUser = async (input: RegisterInput) => {
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: null,
    },
    select: publicUser,
  });

  return { user, accessToken: await tokenFor(user) };
};

export const register = (input: RegisterInput) => createUser(input);

export const assignRole = async ({ email, role }: AssignRoleInput) => {
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role },
      select: publicUser,
    });
    return { user };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      const notFound = new Error("Registered user not found");
      Object.assign(notFound, { statusCode: 404 });
      throw notFound;
    }
    throw error;
  }
};

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
