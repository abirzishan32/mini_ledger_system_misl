"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Wallet, X } from "lucide-react";

import { cn } from "cn";
import { signOut as signOutAction } from "@/app/(auth)/actions";
import { isActive, NAV_LINKS } from "./nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The sidebar is one element, not two.
 *
 * On md and up it is a fixed rail that widens on hover. Below md the same
 * element slides in over the page as a drawer. A separate mobile copy would
 * mean maintaining the same four links twice.
 *
 * There is no pin button. The rail sits at 72px and widens to 260px while the
 * pointer is on it, and the content's padding follows in the same transition
 * so it is pushed rather than covered.
 *
 * Expanding is delayed by 150ms and collapsing is not: brushing the left edge
 * on the way somewhere else should not reflow the page, but leaving should
 * hand the space back immediately.
 */
export function Sidebar({ username }: { username?: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      {/* Only route out of the page below md, so it must never be hidden. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2.5 border-b bg-background px-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="rounded-lg p-2 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Brand />
      </div>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/25 md:hidden"
        />
      )}

      <aside
        aria-label="Sections"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r bg-sidebar shadow-sm transition-[width,transform,box-shadow] duration-300 ease-out",
          // No overlay shadow: the content moves out of the way, so there is
          // nothing to float above.
          "md:w-[72px] md:hover:w-[260px] md:hover:delay-150",
          drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <Brand />

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* No overflow here on purpose: a scroll container clips both axes,
            which would cut the collapsed tooltips off at the rail's edge. */}
        <nav className="flex-1 py-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                // Closed here rather than by watching the path: tapping a link
                // is the event that should close the drawer, and handling it
                // where it happens avoids the extra render an effect costs.
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "group/nav relative mx-2 my-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {/* The accent bar reads as "you are here" even with labels hidden. */}
                {active && (
                  <span
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate rail-narrow:md:hidden">{label}</span>

                {/* Tooltip for the narrow rail only. Once hover has widened it,
                    the real label is back and a tooltip would be a duplicate. */}
                <span className="pointer-events-none absolute left-full z-10 ml-2 hidden whitespace-nowrap rounded-lg bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity group-hover/nav:opacity-100 rail-narrow:md:block">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t p-2">
          <ThemeToggle />

          <div className="mt-1 flex items-center gap-3 rounded-lg px-3.5 py-2.5">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              {initials(username)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm rail-narrow:md:hidden">
              {username ?? "Signed in"}
            </span>
          </div>

          {/* A plain form, so signing out still works without JavaScript. */}
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="grid w-11 shrink-0 place-items-center">
                <LogOut className="size-5" aria-hidden="true" />
              </span>
              <span className="truncate rail-narrow:md:hidden">Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="size-4" aria-hidden="true" />
      </span>
      <span className="truncate text-sm font-semibold tracking-tight rail-narrow:md:hidden">
        Mini Ledger
      </span>
    </>
  );
}

function initials(username?: string): string {
  if (!username) return "?";
  const parts = username.split(/[.\s_-]+/).filter(Boolean);
  return (
    parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2)
  ).toUpperCase();
}
