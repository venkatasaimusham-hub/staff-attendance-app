"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { Settings } from "@/lib/types";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const setSettings = useAppStore((s) => s.setSettings);
  const settings = useAppStore((s) => s.settings);

  // Load settings once on mount (used for sidebar brand name).
  useEffect(() => {
    api<Settings>("/api/settings")
      .then(setSettings)
      .catch(() => {});
  }, [setSettings]);

  // Refresh settings when returning to app (e.g. after edit).
  useEffect(() => {
    if (isAuthed && !settings) {
      api<Settings>("/api/settings").then(setSettings).catch(() => {});
    }
  }, [isAuthed, settings, setSettings]);

  if (!isAuthed) return <LoginScreen />;
  return <AppShell />;
}
