import prisma from "@/lib/prisma";
import PhotoGrid from "./PhotoGrid";

const LIMIT = 18;

const norm = (t: string) => String(t).replace(/^#/, "").toLowerCase();

export default async function RelatedPhotos({
    photoId,
    tags,
    location,
}: {
    photoId: string;
    tags: string[];
    location?: string | null;
}) {
    if (!tags.length && !location) return null;

    const candidates = await prisma.photo.findMany({
        where: {
            id: { not: photoId },
            OR: [
                ...(tags.length ? [{ tags: { hasSome: tags } }] : []),
                ...(location ? [{ location }] : []),
            ],
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
            id: true,
            title: true,
            imageUrl: true,
            width: true,
            height: true,
            blurDataURL: true,
            tags: true,
            location: true,
        },
    });

    if (candidates.length === 0) return null;

    const mine = new Set(tags.map(norm));
    const related = candidates
        .map((p) => ({
            p,
            score:
                p.tags.filter((t) => mine.has(norm(t))).length * 2 +
                (location && p.location === location ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, LIMIT)
        .map(({ p }) => p);

    return (
        <section className="mt-16 border-t border-stone-200 pt-10">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                More like this
            </h2>

            <PhotoGrid
                photos={related}
                className="mt-6 columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4"
            />
        </section>
    );
}