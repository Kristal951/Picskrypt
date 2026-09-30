"use client";

import { useState } from "react";

const GRADIENTS: [string, string][] = [
    ["#6366f1", "#8b5cf6"], 
    ["#ec4899", "#f43f5e"], 
    ["#ea580c", "#dc2626"],
    ["#059669", "#0d9488"], 
    ["#0284c7", "#4f46e5"], 
    ["#c026d3", "#7c3aed"], 
    ["#0d9488", "#0284c7"], 
    ["#d97706", "#ea580c"], 
];

const PLACEHOLDER_RE = /^user_[0-9a-f]{8}$/;

function hash(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function firstChar(s: string): string {
    return Array.from(s)[0] ?? "";
}

function getInitials(name?: string | null, username?: string | null): string {
    const n = (name ?? "").trim();
    if (n) {
        const parts = n.split(/\s+/).filter(Boolean);
        const first = firstChar(parts[0]);
        const last = parts.length > 1 ? firstChar(parts[parts.length - 1]) : "";
        return (first + last).toUpperCase();
    }

    const u = (username ?? "").trim();
    if (u && !PLACEHOLDER_RE.test(u)) return firstChar(u).toUpperCase();

    return "P";
}

function avatarUrl(src: string, size: number): string {
    if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
        return src;
    }
    const px = Math.round(size * 2);
    return src.replace(
        "/upload/",
        `/upload/f_auto,q_auto,c_fill,g_auto,w_${px},h_${px}/`,
    );
}

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    username?: string | null;
    seed?: string | null; 
    size?: number; 
    className?: string;
}

export default function Avatar({
    src,
    name,
    username,
    seed,
    size = 32,
    className = "",
}: AvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const showImage = Boolean(src) && src !== failedSrc;

    const label = name?.trim() || username || "User";

    if (showImage) {
        return (
            <img
                src={avatarUrl(src as string, size)}
                alt={label}
                width={size}
                height={size}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailedSrc(src as string)}
                className={`shrink-0 rounded-full object-cover ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }

    const [from, to] =
        GRADIENTS[hash(seed || username || name || "picskrypt") % GRADIENTS.length];

    return (
        <span
            role="img"
            aria-label={label}
            className={`shrink-0 inline-flex items-center justify-center rounded-full font-bold text-white select-none ${className}`}
            style={{
                width: size,
                height: size,
                fontSize: Math.max(10, Math.round(size * 0.4)),
                lineHeight: 1,
                background: `linear-gradient(135deg, ${from}, ${to})`,
            }}
        >
            {getInitials(name, username)}
        </span>
    );
}