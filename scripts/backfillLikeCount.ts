import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  const { default: prisma } = await import("../lib/prisma");
  try {
    const res = await prisma.photo.updateMany({
      where: { OR: [{ likeCount: null }, { likeCount: { isSet: false } }] },
      data: { likeCount: 0 },
    });
    console.log(`Set likeCount to 0 on ${res.count} photos`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
