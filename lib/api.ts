import type { OnboardingInput, User } from "@/store/types";
import { Picture } from "@/types/Photo";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface PicturesPage {
  items: Picture[];
  nextCursor: string | null;
}

async function apiFetch<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError(
        data?.error || data?.message || `Request failed (${res.status})`,
        res.status,
      );
    }

    return data as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPictures(
  cursor?: string | null,
): Promise<PicturesPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const data = await apiFetch<PicturesPage | Picture[]>(`/api/pictures${qs}`);

  if (Array.isArray(data)) return { items: data, nextCursor: null };
  return { items: data?.items ?? [], nextCursor: data?.nextCursor ?? null };
}

export async function createPicture(formData: FormData): Promise<Picture> {
  const data = await apiFetch<{ picture?: Picture } & Partial<Picture>>(
    "/api/pictures/create",
    { method: "POST", body: formData },
    60000,
  );
  return (data.picture ?? data) as Picture;
}

export async function requestMagicLink(email: string): Promise<void> {
  await apiFetch<unknown>("/api/auth/magic/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function getMe(): Promise<User | null> {
  try {
    const data = await apiFetch<{ user: User | null }>("/api/auth/me");
    return data.user ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function logoutRequest(): Promise<void> {
  await apiFetch<unknown>("/api/auth/logout", { method: "POST" });
}

export async function updateProfile(input: {
  name?: string;
  avatar?: string;
  username?: string;
}): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function checkUsername(
  username: string,
): Promise<{ available: boolean; reason: string | null }> {
  return apiFetch(`/api/auth/username?u=${encodeURIComponent(username)}`);
}

export async function saveOnboardingStep(
  input: OnboardingInput,
): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function uploadAvatar(blob: Blob): Promise<User> {
  const fd = new FormData();
  fd.append("file", blob, "avatar.jpg");
  const data = await apiFetch<{ user: User }>(
    "/api/auth/avatar",
    { method: "POST", body: fd },
    60000,
  );
  return data.user;
}

export async function googleSignIn(credential: string): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  return data.user;
}

export async function getGoogleNonce(): Promise<string> {
  const data = await apiFetch<{ nonce: string }>("/api/auth/google/nonce", {
    cache: "no-store",
  });
  return data.nonce;
}

export async function setLike(
  id: string,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number }> {
  return apiFetch(`/api/pictures/${id}/like`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
}

export async function setSave(
  id: string,
  saved: boolean,
): Promise<{ saved: boolean }> {
  return apiFetch(`/api/pictures/${id}/save`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saved }),
  });
}

export async function deletePicture(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/pictures/${id}`, { method: "DELETE" });
}
