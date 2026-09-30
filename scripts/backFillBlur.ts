import "dotenv/config";
import prisma from "../lib/prisma";
import { getBlurDataURL } from "../lib/blur";

async function main() {
  const photos = await prisma.photo.findMany({
    where: {
      OR: [{ blurDataURL: null }, { blurDataURL: { isSet: false } }],
    },
    select: { id: true, imageUrl: true },
  });
  console.log(`Backfilling ${photos.length} photos...`);

  for (const p of photos) {
    const blurDataURL = await getBlurDataURL(p.imageUrl);
    if (blurDataURL) {
      await prisma.photo.update({ where: { id: p.id }, data: { blurDataURL } });
      console.log("done", p.id);
    } else {
      console.warn("skipped", p.id);
    }
  }
}

main().finally(() => prisma.$disconnect());
