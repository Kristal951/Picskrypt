import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

export type GridPhoto = {
    id: string;
    title: string;
    imageUrl: string;
    width: number;
    height: number;
    blurDataURL?: string | null;
};

const SRC_WIDTHS = [320, 640, 960];

export default function PhotoGrid({
    photos,
    className = "columns-2 gap-3 sm:columns-3 sm:gap-4",
}: {
    photos: GridPhoto[];
    className?: string;
}) {
    return (
        <ul className={className}>
            {photos.map((photo) => {
                const isCloudinary =
                    photo.imageUrl.includes("res.cloudinary.com") &&
                    photo.imageUrl.includes("/upload/");

                const usable = SRC_WIDTHS.filter((w) => w <= photo.width);
                const widths = usable.length
                    ? usable
                    : [Math.round(photo.width)];

                const src = isCloudinary
                    ? cloudinaryLoader({
                        src: photo.imageUrl,
                        width: widths[Math.min(1, widths.length - 1)],
                    })
                    : photo.imageUrl;

                const srcSet = isCloudinary
                    ? widths
                        .map(
                            (w) =>
                                `${cloudinaryLoader({
                                    src: photo.imageUrl,
                                    width: w,
                                })} ${w}w`
                        )
                        .join(", ")
                    : undefined;

                return (
                    <li
                        key={photo.id}
                        className="mb-3 break-inside-avoid sm:mb-4"
                    >
                        <Link
                            href={`/pictures/${photo.id}`}
                            className="group block overflow-hidden rounded-xl bg-stone-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25"
                        >
                            <img
                                src={src}
                                srcSet={srcSet}
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                                alt={photo.title}
                                width={photo.width}
                                height={photo.height}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                className="block h-auto w-full transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none"
                                style={{
                                    aspectRatio: `${photo.width} / ${photo.height}`,
                                    ...(photo.blurDataURL
                                        ? {
                                            backgroundImage: `url(${photo.blurDataURL})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }
                                        : {}),
                                }}
                            />
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}