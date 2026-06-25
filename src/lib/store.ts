// Global app state via zustand: active view, admin auth, settings.
import { create } from "zustand";
import type { Settings } from "./types";

export type ViewKey =
  | "dashboard"
  | "workers"
  | "attendance"
  | "salary"
  | "reports"
  | "settings";

interface AppState {
  // Navigation
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // Auth (simple admin gate, no real backend auth needed)
  isAuthed: boolean;
  login: (password: string) => boolean;
  logout: () => void;

  // Settings cache
  settings: Settings | null;
  setSettings: (s: Settings | null) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Default admin password — for a local/offline small-business tool.
const ADMIN_PASSWORD = "admin123";

export const useAppStore = create<AppState>((set, get) => ({
  view: "dashboard",
  setView: (v) => {
    set({ view: v, sidebarOpen: false });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  },

  isAuthed:
    typeof window !== "undefined" &&
    localStorage.getItem("swm_authed") === "1",
  login: (password) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("swm_authed", "1");
      set({ isAuthed: true });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem("swm_authed");
    set({ isAuthed: false, view: "dashboard" });
  },

  settings: null,
  setSettings: (s) => set({ settings: s }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
