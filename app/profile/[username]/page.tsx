import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { isPlaceholderUsername } from "@/lib/username";
import Avatar from "@/components/ui/Avatar";
import PhotoGrid from "@/components/PhotoGrid";

type Props = { params: Promise<{ username: string }> };

async function getProfile(username: string) {
    const user = await prisma.user.findFirst({
        where: { username },
        select: { id: true, name: true, username: true, avatar: true },
    });
    if (!user) return null;

    const photos = await prisma.photo.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
            id: true,
            title: true,
            imageUrl: true,
            width: true,
            height: true,
            blurDataURL: true,
        },
    });

    return { user, photos };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const data = await getProfile(decodeURIComponent(username));
    if (!data) return { title: "Profile not found · Picskrypt" };

    const { user } = data;
    const label = user.name || `@${user.username}`;
    return { title: `${label} · Picskrypt` };
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;
    const data = await getProfile(decodeURIComponent(username));
    if (!data) notFound();

    const { user, photos } = data;

    const handle =
        user.username && !isPlaceholderUsername(user.username)
            ? `@${user.username}`
            : null;

    const displayName = user.name || handle || "Unknown photographer";

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-5 sm:px-6 md:pt-8">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-2 rounded-md text-sm font-semibold text-stone-500 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                    Back to gallery
                </Link>

                <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
                    <header className="flex items-center gap-5 lg:sticky lg:top-8 lg:w-72 lg:shrink-0 lg:flex-col lg:items-start lg:gap-6">
                        <Avatar
                            src={user.avatar}
                            name={user.name}
                            username={user.username}
                            seed={user.id}
                            size={112}
                        />

                        <div className="min-w-0">
                            <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
                                {displayName}
                            </h1>

                            {user.name && handle ? (
                                <p className="mt-1 truncate text-sm text-stone-500">
                                    {handle}
                                </p>
                            ) : null}

                            <p className="mt-4 text-sm text-stone-600">
                                {photos.length === 1
                                    ? "1 photo"
                                    : `${photos.length} photos`}
                            </p>
                        </div>
                    </header>

                    <section className="min-w-0 flex-1" aria-label="Photos">
                        {photos.length === 0 ? (
                            <p className="rounded-2xl bg-stone-100 px-6 py-16 text-center text-sm text-stone-600">
                                {displayName} hasn&apos;t posted any photos yet.
                            </p>
                        ) : (
                            <PhotoGrid photos={photos} />
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}