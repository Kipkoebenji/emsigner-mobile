import type { RequestHandler } from "express";
import type {
  CreateUserInput,
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
    res
      .status(400)
      .json({
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
    res
      .status(400)
      .json({
        message:
          "A valid email and a password of 8-128 characters are required",
      });
    return;
  }
  next();
};

export const validateCreateUser: RequestHandler = (req, res, next) => {
  const body = validateCredentials(req.body);
  const validRole =
    body &&
    "role" in req.body &&
    ["CHAIRPERSON", "SECRETARY", "MEMBER"].includes(req.body.role);
  if (
    !body ||
    !("fullName" in body) ||
    typeof body.fullName !== "string" ||
    !validRole
  ) {
    res
      .status(400)
      .json({
        message: "fullName, email, password, and a valid role are required",
      });
    return;
  }
  req.body = {
    ...body,
    fullName: body.fullName.trim(),
    role: req.body.role,
  } satisfies CreateUserInput;
  next();
};
