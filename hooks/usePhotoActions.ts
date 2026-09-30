"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/hooks/useToast";
import { setLike, setSave, deletePicture } from "@/lib/api";
import { absolutePhotoUrl, copyText, downloadUrl } from "@/lib/photo-utils";
import { Picture } from "@/types/Photo";

interface Options {
  onPatch: (patch: Partial<Picture>) => void;
  onDeleted?: () => void;
}

export function usePhotoActions(
  photo: Picture,
  { onPatch, onDeleted }: Options,
) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const { showToast } = useToast(); 
  const busy = useRef({ like: false, save: false, remove: false });

  const isOwner = !!user && user.id === photo.userId;

  const requireLogin = (): boolean => {
    if (user) return false;
    router.push("/login");
    return true;
  };

  const toggleLike = async () => {
    if (requireLogin() || busy.current.like) return;
    busy.current.like = true;

    const prevLiked = !!photo.likedByMe;
    const prevCount = photo.likeCount ?? 0;
    const nextLiked = !prevLiked;

    onPatch({
      likedByMe: nextLiked,
      likeCount: Math.max(0, prevCount + (nextLiked ? 1 : -1)),
    });

    try {
      const res = await setLike(photo.id, nextLiked);
      onPatch({ likedByMe: res.liked, likeCount: res.likeCount });
    } catch (err: any) {
      onPatch({ likedByMe: prevLiked, likeCount: prevCount });
      showToast(err?.message || "Couldn't update like.", "error");
    } finally {
      busy.current.like = false;
    }
  };

  const toggleSave = async () => {
    if (requireLogin() || busy.current.save) return;
    busy.current.save = true;

    const prevSaved = !!photo.savedByMe;
    const nextSaved = !prevSaved;
    onPatch({ savedByMe: nextSaved });

    try {
      const res = await setSave(photo.id, nextSaved);
      onPatch({ savedByMe: res.saved });
      showToast(res.saved ? "Saved" : "Removed from saved", "success");
    } catch (err: any) {
      onPatch({ savedByMe: prevSaved });
      showToast(err?.message || "Couldn't update save.", "error");
    } finally {
      busy.current.save = false;
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = downloadUrl(photo.imageUrl, photo.title);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyLink = async () => {
    const ok = await copyText(absolutePhotoUrl(photo.id));
    showToast(
      ok ? "Link copied" : "Couldn't copy the link",
      ok ? "success" : "error",
    );
  };

  const share = async () => {
    const url = absolutePhotoUrl(photo.id);
    const title = photo.title || "Photo on Picskrypt";

    const isTouch =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouch && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: photo.story?.slice(0, 120) || title,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const remove = async () => {
    if (!isOwner || busy.current.remove) return;
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    busy.current.remove = true;

    try {
      await deletePicture(photo.id);
      showToast("Photo deleted", "success");
      onDeleted?.();
    } catch (err: any) {
      showToast(err?.message || "Couldn't delete the photo.", "error");
    } finally {
      busy.current.remove = false;
    }
  };

  return { isOwner, toggleLike, toggleSave, download, share, copyLink, remove };
}
