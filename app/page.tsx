"use client";
import Home from "@/components/pages/Home";
import Navbar from "@/components/ui/Navbar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { usePictureStore } from "@/store/pictureStore";
import { useEffect, useMemo, useState } from "react";

const page = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { pictures } = usePictureStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrolled]);

  const suggestions = useMemo(() => {
    const out = new Set<string>();

    for (const p of pictures) {
      for (const t of p.tags ?? []) {
        const tag = String(t).trim();
        if (!tag) continue;
        out.add(tag.startsWith("#") ? tag : `#${tag}`);
      }

      if (p.location) out.add(`loc:${String(p.location).trim()}`);

      if (p.id) out.add(`id:${String(p.id)}`);
    }

    out.add("cat:art");
    out.add("user:12345");

    return Array.from(out).slice(0, 50);
  }, [pictures]);

  return (
    <div className="w-full h-full flex flex-col">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        scrolled={scrolled}
        suggestions={suggestions}
      />
      <Home
        searchQuery={searchQuery}
        // setSearchQuery={setSearchQuery}
        // scrolled={scrolled}
        // setScrolled={setScrolled}
      />
      <ThemeToggle/>
    </div>
  );
};

export default page;
