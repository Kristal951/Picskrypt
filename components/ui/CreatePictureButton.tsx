"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

const CreatePictureButton = () => {
    return (
        <Link
            href="/pictures/create"
            aria-label="Post photo"
            className="
                fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))]
                right-6 z-50
                group flex h-14 w-14 items-center justify-center
                rounded-full
                bg-indigo-600 text-white
                shadow-lg shadow-indigo-600/25
                transition-all duration-200
                hover:scale-105
                hover:bg-indigo-700
                hover:shadow-[0_10px_30px_-8px_rgba(79,70,229,0.65)]
                active:scale-95
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-indigo-500/25
            "
        >
            <Plus
                className="
                    h-7 w-7
                    stroke-[2.5]
                    transition-transform duration-300
                    group-hover:rotate-90
                "
            />
        </Link>
    );
};

export default CreatePictureButton;