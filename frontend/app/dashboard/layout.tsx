import { Sidebar } from "./sidebar";
import { getSession, readAccessTokenClaims } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const username = session
    ? readAccessTokenClaims(session.accessToken)?.unique_name
    : undefined;

  return (
    <div className="min-h-svh">
      <Sidebar username={username} />

      <div className="pt-14 transition-[padding] duration-300 ease-out md:pt-0 md:pl-[72px] rail-hover:md:pl-[260px]">
        <main className="mx-auto w-full max-w-5xl px-3 py-8 sm:px-5">
          {children}
        </main>
      </div>
    </div>
  );
}
