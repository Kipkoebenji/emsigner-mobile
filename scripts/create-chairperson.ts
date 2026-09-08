import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { UserRole } from "../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../src/utils/password.js";

const [fullName, email] = process.argv.slice(2);

if (!fullName || !email) {
  console.error('Usage: pnpm create-chairperson "Full Name" email@example.com');
  process.exitCode = 1;
} else {
  const normalizedEmail = email.trim().toLowerCase();
  const existingChairperson = await prisma.user.findFirst({
    where: { role: UserRole.CHAIRPERSON },
    select: { id: true },
  });

  if (existingChairperson) {
    console.error(
      "A chairperson already exists. Use the authenticated API to create another one.",
    );
    process.exitCode = 1;
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      console.error("A user with that email already exists.");
      process.exitCode = 1;
    } else {
      const readline = createInterface({ input, output });
      const password = await readline.question(
        "Chairperson password (hidden input is unavailable in this script): ",
      );
      const confirmation = await readline.question("Confirm password: ");
      readline.close();

      if (
        password.length < 8 ||
        password.length > 128 ||
        password !== confirmation
      ) {
        console.error(
          "Passwords must match and be between 8 and 128 characters.",
        );
        process.exitCode = 1;
      } else {
        const user = await prisma.user.create({
          data: {
            fullName: fullName.trim(),
            email: normalizedEmail,
            passwordHash: await hashPassword(password),
            role: UserRole.CHAIRPERSON,
          },
          select: { id: true, fullName: true, email: true, role: true },
        });
        console.log(
          `Created chairperson ${user.fullName} (${user.email}) with id ${user.id}`,
        );
      }
    }
  }
}

await prisma.$disconnect();
