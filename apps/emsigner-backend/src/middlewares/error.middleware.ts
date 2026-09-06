import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);
  const status = typeof error.statusCode === "number" ? error.statusCode : 500;
  const message = status === 500 ? "Internal server error" : error.message;
  res.status(status).json({ message });
};
