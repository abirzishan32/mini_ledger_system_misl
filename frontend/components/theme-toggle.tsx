"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "cn";

/**
 * A switch, not a button: it has two states and shows which one it is in, so
 * role="switch" with aria-checked is what a screen reader should hear.
 *
 * The icon lives in the thumb so the control always shows the theme you are
 * in. Nothing renders until mount — before hydration the server cannot know
 * what the browser will resolve "system" to, and guessing is wrong half the
 * time.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Detecting that hydration has finished is what an effect is for: the server
  // render has no resolved theme, so the switch must show its neutral state
  // until the browser takes over. There is no render-phase form of "has this
  // mounted yet" that does not lie on the first pass.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount detection
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={mounted ? (dark ? "Dark theme on" : "Dark theme off") : "Theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          dark ? "bg-primary/80" : "bg-muted-foreground/25",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 grid size-5 place-items-center rounded-full bg-background shadow-sm transition-transform duration-300 ease-out",
            dark && "translate-x-5",
          )}
        >
          {mounted &&
            (dark ? (
              <Moon className="size-3 text-foreground" aria-hidden="true" />
            ) : (
              <Sun className="size-3 text-foreground" aria-hidden="true" />
            ))}
        </span>
      </span>

      <span className="truncate rail-narrow:md:hidden">
        {mounted ? (dark ? "Dark" : "Light") : "Theme"}
      </span>
    </button>
  );
}
