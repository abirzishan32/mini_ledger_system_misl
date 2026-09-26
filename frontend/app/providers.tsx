"use client";

import { ThemeProvider } from "next-themes";

/**
 * next-themes writes the class on <html> before paint, which is the part worth
 * not hand-rolling: reading localStorage in an effect would repaint the whole
 * page a frame after load.
 */
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
