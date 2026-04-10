"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const DARK = {
  bg: "#1a1a26",
  bg2: "#1f1f2b",
  text: "#abb2bf",
  comment: "#565c64",
  border: "#282c34",
  red: "#E06C75",
  orange: "#d19a66",
  yellow: "#e5c07b",
  blue: "#61afef",
  green: "#98c379",
  magenta: "#c678dd",
  cyan: "#56b6c2",
  tiles: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

const LIGHT = {
  bg: "#fafafa",
  bg2: "#f0f0f2",
  text: "#383a42",
  comment: "#a0a1a7",
  border: "#d3d3d8",
  red: "#d84a3d",
  orange: "#c18401",
  yellow: "#986801",
  blue: "#4078f2",
  green: "#50a14f",
  magenta: "#a626a4",
  cyan: "#0184bc",
  tiles: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
} as const;

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";
  const colors = isDark ? DARK : LIGHT;
  const getTypeColor = useCallback(
    (type: string) => {
      const map: Record<string, string> = {
        escape: colors.red,
        sighting: colors.orange,
        thermal: colors.magenta,
        unconfirmed: colors.yellow,
        alert: colors.yellow,
        search: colors.blue,
      };
      return map[type] ?? colors.comment;
    },
    [colors]
  );

  return { theme, isDark, colors, getTypeColor };
}
