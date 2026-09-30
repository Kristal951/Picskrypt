import "dotenv/config";
import crypto from "crypto";
import prisma from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });
  const missing = users.filter((u) => !u.username);
  console.log(`Backfilling ${missing.length} of ${users.length} users...`);

  for (const u of missing) {
    await prisma.user.update({
      where: { id: u.id },
      data: { username: `user_${crypto.randomBytes(4).toString("hex")}` },
    });
  }
  console.log("Done");
}

main().finally(() => prisma.$disconnect());
