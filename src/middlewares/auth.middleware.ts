import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";
import type { UserRole } from "../../generated/prisma/enums.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { payload } = await jwtVerify(header.slice(7), secret);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string" ||
      (payload.role !== null && typeof payload.role !== "string")
    ) {
      res.status(401).json({ message: "Invalid access token" });
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role as UserRole | null,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
};

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };

export const canDownload = authorize("CHAIRPERSON", "SECRETARY");
export const canSign = authorize("CHAIRPERSON", "MEMBER");
