import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Mini Ledger", template: "%s · Mini Ledger" },
  description:
    "Track accounts, record debit and credit entries, and follow running balances.",
};

// The document shell: fonts, metadata, and the Providers wrapper that gives
// next-themes to everything below. suppressHydrationWarning because
// next-themes writes the theme class on <html> before React hydrates, which
// would otherwise be reported as a server/client mismatch.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
