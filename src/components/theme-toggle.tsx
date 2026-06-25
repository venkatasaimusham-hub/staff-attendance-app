"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9"
    >
      {isDark ? (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <Moon className="h-[1.15rem] w-[1.15rem]" />
      )}
    </Button>
  );
}
