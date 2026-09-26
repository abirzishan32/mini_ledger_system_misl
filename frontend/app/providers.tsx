"use client";

import { ThemeProvider } from "next-themes";

// Wraps the app in next-themes so ThemeToggle has something to read and write.
// The part worth not hand-rolling is that it writes the class on <html> before
// paint; reading localStorage in an effect would repaint the page a frame late.
// Mounted once by the root layout.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
