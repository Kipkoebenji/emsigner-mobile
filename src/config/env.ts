import "dotenv/config";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: jwtSecret,
  PORT: Number(process.env.PORT ?? 3000),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
};
