"use client";

import { useState, useCallback } from "react";

export type Locale = "ko" | "en";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("ko");
  const toggle = useCallback(() => setLocale((l) => (l === "ko" ? "en" : "ko")), []);
  const t = useCallback(
    (ko: string, en: string) => (locale === "ko" ? ko : en),
    [locale]
  );
  return { locale, toggle, t };
}
