import { create } from "zustand";
import type { PictureStore } from "./types";
import { createPicture, getPictures } from "@/lib/api";

export const usePictureStore = create<PictureStore>((set, get) => ({
  pictures: [],
  loading: false,
  loadingMore: false,
  error: null,
  nextCursor: null,
  hasMore: false,

  setPictures: (pictures) => set({ pictures }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addPicture: (picture) =>
    set((state) => ({
      pictures: [picture, ...state.pictures],
    })),

  removePicture: (id) =>
    set((state) => ({
      pictures: state.pictures.filter((p) => p.id !== id),
    })),

  clearPictures: () => set({ pictures: [], nextCursor: null, hasMore: false }),
  patchPicture: (id, patch) =>
    set((state) => ({
      pictures: state.pictures.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    })),

  fetchPictures: async () => {
    set({ loading: true, error: null });

    try {
      const { items, nextCursor } = await getPictures();
      set({
        pictures: items,
        nextCursor,
        hasMore: nextCursor !== null,
        loading: false,
        error: null,
      });
      return items;
    } catch (err: any) {
      set({ loading: false, error: err?.message || "Something went wrong" });
      throw err;
    }
  },

  loadMore: async () => {
    const { nextCursor, loadingMore, loading } = get();
    if (!nextCursor || loadingMore || loading) return;

    set({ loadingMore: true, error: null });

    try {
      const { items, nextCursor: newCursor } = await getPictures(nextCursor);

      set((state) => {
        const seen = new Set(state.pictures.map((p) => p.id));
        return {
          pictures: [
            ...state.pictures,
            ...items.filter((p) => !seen.has(p.id)),
          ],
          nextCursor: newCursor,
          hasMore: newCursor !== null,
          loadingMore: false,
        };
      });
    } catch (err: any) {
      set({
        loadingMore: false,
        error: err?.message || "Something went wrong",
      });
    }
  },

  uploadPicture: async (formData) => {
    set({ loading: true, error: null });

    try {
      const newPicture = await createPicture(formData);

      set((state) => ({
        pictures: [newPicture, ...state.pictures],
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      set({ loading: false, error: err?.message || "Something went wrong" });
      throw err;
    }
  },
}));
