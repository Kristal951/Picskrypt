import { Photo, Picture } from "@/types/Photo";

export interface PictureStore {
  pictures: Picture[];
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  nextCursor: string | null;
  hasMore: boolean;

  loadMore: () => Promise<void>;
  setPictures: (pictures: Picture[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  patchPicture: (id: string, patch: Partial<Picture>) => void;

  addPicture: (picture: Picture) => void;
  removePicture: (id: string) => void;
  clearPictures: () => void;

  uploadPicture: (formData: FormData) => Promise<void>;
  fetchPictures: () => Promise<Picture[]>;
}

type MagicStatus = "idle" | "sending" | "sent" | "error";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  photos?: Photo[];
  username?: string;
  onboarded: boolean;
  onboardingStep: 1 | 2 | 3;
}

export type UserStore = {
  user: User | null;
  loading: boolean;
  magicEmail: string;
  magicStatus: MagicStatus;
  magicErrorMsg: string;
  magicCooldown: number;
  hydrated?: boolean;

  setUser: (user: User | null) => void;
  setLoading: (value: boolean) => void;
  logout: () => Promise<void>;
  hydrateUser: () => Promise<void>;
  resetMagic: () => void;

  setMagicEmail: (email: string) => void;
  setMagicCooldown: (seconds: number) => void;

  sendMagicLink: (opts?: {
    cooldownSeconds?: number;
    toast?: (msg: string, type: "success" | "error") => void;
  }) => Promise<void>;
};

export type OnboardingInput =
  | { step: 1; name: string }
  | { step: 2; username: string }
  | { step: 3 };
