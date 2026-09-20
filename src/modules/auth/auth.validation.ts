import type { RequestHandler } from "express";
import type {
  AssignRoleInput,
  LoginInput,
  RegisterInput,
} from "./auth.types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const validateCredentials = (
  body: unknown,
): RegisterInput | LoginInput | null => {
  if (
    !isRecord(body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return null;
  }
  if (body.password.length < 8 || body.password.length > 128) return null;
  return body as RegisterInput | LoginInput;
};

export const validateRegistration: RequestHandler = (req, res, next) => {
  const body = validateCredentials(req.body);
  if (
    !body ||
    !("fullName" in body) ||
    typeof body.fullName !== "string" ||
    body.fullName.trim().length < 2
  ) {
    res.status(400).json({
      message:
        "fullName, a valid email, and a password of 8-128 characters are required",
    });
    return;
  }
  req.body = {
    ...body,
    fullName: body.fullName.trim(),
  } satisfies RegisterInput;
  next();
};

export const validateLogin: RequestHandler = (req, res, next) => {
  if (!validateCredentials(req.body)) {
    res.status(400).json({
      message: "A valid email and a password of 8-128 characters are required",
    });
    return;
  }
  next();
};

export const validateAssignRole: RequestHandler = (req, res, next) => {
  const body = req.body;
  const validRole =
    isRecord(body) &&
    typeof body.role === "string" &&
    ["CHAIRPERSON", "SECRETARY", "MEMBER"].includes(body.role);
  if (!isRecord(body) || typeof body.email !== "string" || !validRole) {
    res.status(400).json({
      message: "email and a valid role are required",
    });
    return;
  }
  req.body = {
    email: body.email.toLowerCase().trim(),
    role: body.role as AssignRoleInput["role"],
  } satisfies AssignRoleInput;
  next();
};
