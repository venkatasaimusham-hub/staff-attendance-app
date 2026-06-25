"use client";

import { Globe } from "lucide-react";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LangSelector() {
  const { lang, setLang } = useI18n();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as "en" | "hi")}>
      <SelectTrigger
        className="h-9 w-auto gap-1.5 border-none px-2"
        aria-label="Select language"
      >
        <Globe className="h-[1.05rem] w-[1.05rem] text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.native}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
