"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Compass,
  Clock,
  Tag,
  Hash,
  Trash2,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { isPlaceholderUsername } from "@/lib/username";
import Avatar from "./Avatar";

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  scrolled: boolean;
  suggestions?: string[];
}

type Mode = "desktop" | "mobile";

const RECENTS_KEY = "picskrypt_recent_searches_v1";
const MAX_RECENTS = 8;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function uniqByNormalized(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const n = normalize(item);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(item.trim());
  }
  return out;
}

function saveRecents(list: string[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {}
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <span className="text-indigo-700 font-semibold">{match}</span>
      {after}
    </>
  );
}

const handleOf = (u?: string | null) =>
  u && !isPlaceholderUsername(u) ? `@${u}` : null;

const Navbar = ({
  searchQuery,
  setSearchQuery,
  scrolled,
  suggestions = [],
}: NavbarProps) => {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const [recents, setRecents] = useState<string[]>([]);

  const desktopWrapRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const containerClass = useMemo(() => {
    if (!scrolled && !mobileSearchOpen) {
      return "bg-transparent py-6 border-b border-transparent";
    }
    return "bg-white/75 backdrop-blur-xl py-3 border-b border-slate-200/60 shadow-[0_2px_24px_-10px_rgba(15,23,42,0.25)]";
  }, [scrolled, mobileSearchOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecents(
          uniqByNormalized(parsed.filter((x) => typeof x === "string")).slice(
            0,
            MAX_RECENTS,
          ),
        );
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        desktopWrapRef.current?.contains(target) ||
        mobileWrapRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
        setMobileSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const t = setTimeout(() => mobileInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [mobileSearchOpen]);

  const clearSearch = () => {
    setSearchQuery("");
    setActiveIndex(-1);
  };

  const commitRecent = (q: string) => {
    const cleaned = q.trim();
    if (!cleaned) return;
    const next = uniqByNormalized([cleaned, ...recents]).slice(0, MAX_RECENTS);
    setRecents(next);
    saveRecents(next);
  };

  const clearRecents = () => {
    setRecents([]);
    saveRecents([]);
  };

  const onSelectSuggestion = (value: string, mode: Mode) => {
    setSearchQuery(value);
    commitRecent(value);
    setOpen(false);
    setActiveIndex(-1);
    if (mode === "mobile") mobileInputRef.current?.blur(); 
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/");
    router.refresh();
  };

  const filteredSuggestions = useMemo(() => {
    const q = normalize(searchQuery);

    const baseSuggestions = uniqByNormalized(suggestions).slice(0, 50);

    if (!q) {
      const combined = uniqByNormalized([...recents, ...baseSuggestions]);
      return combined.slice(0, 10);
    }

    const fromRecents = recents.filter((r) => normalize(r).includes(q));
    const fromSuggestions = baseSuggestions.filter((s) =>
      normalize(s).includes(q),
    );
    const combined = uniqByNormalized([...fromRecents, ...fromSuggestions]);

    return combined.slice(0, 10);
  }, [searchQuery, recents, suggestions]);

  const showDropdown =
    open && (filteredSuggestions.length > 0 || recents.length > 0);

  const handleKeyDown =
    (mode: Mode) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (
          showDropdown &&
          activeIndex >= 0 &&
          activeIndex < filteredSuggestions.length
        ) {
          e.preventDefault();
          onSelectSuggestion(filteredSuggestions[activeIndex], mode);
          return;
        }

        if (searchQuery.trim()) commitRecent(searchQuery);
        setOpen(false);
        setActiveIndex(-1);
        if (mode === "mobile") e.currentTarget.blur();
        return;
      }

      if (e.key === "ArrowDown" && !showDropdown) {
        setOpen(true);
        return;
      }

      if (!showDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    };

  const renderDropdown = (mode: Mode) => {
    if (!showDropdown) return null;
    const isDesktop = mode === "desktop";

    return (
      <div
        className={`${isDesktop ? "absolute" : ""} mt-2 w-full rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_-25px_rgba(15,23,42,0.45)] overflow-hidden`}
      >
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            {searchQuery.trim() ? "Suggestions" : "Recent searches"}
          </div>

          {recents.length > 0 && !searchQuery.trim() && (
            <button
              type="button"
              onClick={clearRecents}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="h-px bg-slate-200/60" />

        <ul
          id={`search-suggestions-${mode}`}
          role="listbox"
          className={`py-1 ${isDesktop ? "" : "max-h-60 overflow-y-auto overscroll-contain"}`}
        >
          {filteredSuggestions.map((item, idx) => {
            const isActive = idx === activeIndex;
            const isRecent = recents.some(
              (r) => normalize(r) === normalize(item),
            );

            return (
              <li key={`${item}-${idx}`} role="presentation">
                <button
                  type="button"
                  id={`suggestion-${mode}-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectSuggestion(item, mode)}
                  className={`w-full px-3 ${isDesktop ? "py-2.5" : "py-3"} flex items-center gap-2 text-left text-sm transition-colors
                    ${isActive ? "bg-indigo-50 text-slate-900" : "hover:bg-slate-50 text-slate-800"}`}
                >
                  <span className="shrink-0">
                    {isRecent ? (
                      <Clock className="w-4 h-4 text-slate-400" />
                    ) : searchQuery.trim().startsWith("#") ? (
                      <Hash className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Tag className="w-4 h-4 text-slate-400" />
                    )}
                  </span>

                  <span className="flex-1 truncate">
                    {highlightMatch(item, searchQuery)}
                  </span>

                  {isRecent && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Recent
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {filteredSuggestions.length === 0 && (
            <li role="presentation" className="px-3 py-3 text-sm text-slate-500">
              No suggestions found.
            </li>
          )}
        </ul>
      </div>
    );
  };

  const renderSearch = (mode: Mode) => {
    const isDesktop = mode === "desktop";
    const inputRef = isDesktop ? desktopInputRef : mobileInputRef;

    return (
      <div ref={isDesktop ? desktopWrapRef : mobileWrapRef} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search
            className={`w-4 h-4 transition-all duration-300 ${
              searchQuery ? "text-indigo-600 scale-110" : "text-slate-400"
            }`}
          />
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-controls={`search-suggestions-${mode}`}
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && activeIndex >= 0
              ? `suggestion-${mode}-${activeIndex}`
              : undefined
          }
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          placeholder="Search categories, tags, or IDs…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown(mode)}
          className="w-full rounded-2xl py-2.75 pl-11 pr-10 text-sm font-medium
                     bg-slate-100/80 border border-slate-200/70 text-slate-800 placeholder:text-slate-400
                     outline-none transition-all
                     focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              clearSearch();
              inputRef.current?.focus();
              setOpen(true);
            }}
            className="absolute right-2 top-[1.35rem] -translate-y-1/2 p-1.5 rounded-full
                       hover:bg-slate-200/80 transition-colors
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}

        {renderDropdown(mode)}
      </div>
    );
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${containerClass}`}
    >
      <div className="w-full mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="relative group active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 rounded-2xl"
              onClick={() => {
                setSearchQuery("");
                setMobileSearchOpen(false);
                setOpen(false);
                setActiveIndex(-1);
              }}
              aria-label="Go home"
            >
              <div className="relative w-32 h-8 md:w-40 md:h-10">
                <Image
                  src="/assets/PicsKrypt_2.png"
                  alt="PicsKrypt"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </Link>
          </div>

          <div className="flex-1 max-w-xl hidden sm:block">
            {renderSearch("desktop")}
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         text-slate-600 hover:text-indigo-600 hover:bg-indigo-50
                         transition-all active:scale-[0.98]
                         focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
            >
              <Compass className="w-4 h-4" />
              Explore
            </button>

            <Link
              href="/pictures/create"
              aria-label="Post photo"
              className="px-3 md:px-4 py-3 rounded-md text-sm font-bold
                         bg-indigo-600 text-white
                         hover:bg-indigo-700 hover:shadow-[0_10px_26px_-10px_rgba(79,70,229,0.6)]
                         transition-all active:scale-[0.98]
                         focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25
                         flex items-center gap-2"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
              <span className="hidden sm:inline">Post Photo</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                setOpen(false);
                setActiveIndex(-1);
              }}
              className={`sm:hidden p-2.5 rounded-2xl transition-all active:scale-[0.98]
                ${
                  mobileSearchOpen
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                }
                focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20`}
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              aria-expanded={mobileSearchOpen}
            >
              {mobileSearchOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>

            {!mounted ? (
              <div
                aria-hidden
                className="w-10 h-10 rounded-full bg-slate-200/70 animate-pulse"
              />
            ) : user ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="block rounded-full active:scale-[0.98] transition-transform
                             focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25"
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    username={user.username}
                    seed={user.id}
                    size={40}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-xl
                               shadow-[0_18px_50px_-25px_rgba(15,23,42,0.45)] overflow-hidden"
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.name || "Your account"}
                      </p>
                      {handleOf(user.username) ? (
                        <p className="text-xs text-slate-500 truncate">
                          {handleOf(user.username)}
                        </p>
                      ) : null}
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    <div className="py-1">
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-3 md:px-4 py-3 rounded-md text-sm font-semibold text-slate-700
                           hover:bg-slate-100 transition-all active:scale-[0.98]
                           focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ${
            mobileSearchOpen
              ? "max-h-[80vh] opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0 invisible"
          }`}
        >
          {renderSearch("mobile")}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;