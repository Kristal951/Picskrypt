import { config } from "dotenv";
config({ path: ".env.local" });
config();

const APPLY = process.argv.includes("--delete");

async function main() {
  const { default: prisma } = await import("../lib/prisma");
  const { default: cloudinary } = await import("../lib/cloudinary");

  try {
    const [users, photos] = await Promise.all([
      prisma.user.findMany({ select: { id: true } }),
      prisma.photo.findMany({
        select: { id: true, userId: true, publicId: true, title: true },
      }),
    ]);

    const userIds = new Set(users.map((u) => u.id));
    const orphans = photos.filter((p) => !userIds.has(p.userId));

    console.log(`${orphans.length} orphaned photos out of ${photos.length}`);
    for (const p of orphans) {
      console.log(`- ${p.id} "${p.title}" (userId ${p.userId})`);
    }

    if (!APPLY) {
      console.log("Dry run only. Rerun with --delete to remove them.");
      return;
    }

    for (const p of orphans) {
      if (p.publicId) {``
        try {
          await cloudinary.uploader.destroy(p.publicId, { invalidate: true });
        } catch (err) {
          console.error("Cloudinary destroy failed for", p.publicId, err);
        }
      }
      await prisma.photo.delete({ where: { id: p.id } });
    }
    console.log("Deleted.");
  } finally {
    await prisma.$disconnect();
  }
}

main();
