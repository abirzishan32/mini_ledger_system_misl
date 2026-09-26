import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

// The app has no public landing page: the root sends you to the dashboard or to
// sign-in depending on whether getSession finds cookies. Done here rather than in
// proxy.ts so it holds even if the matcher there changes.
export default async function Home() {
  const session = await getSession();

  redirect(session ? "/dashboard" : "/login");
}
