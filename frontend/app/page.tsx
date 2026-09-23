import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

/**
 * The app has no public landing page: the root simply sends you to the right
 * place. Done here rather than in proxy.ts so it holds even if the matcher
 * changes.
 */
export default async function Home() {
  const session = await getSession();

  redirect(session ? "/dashboard" : "/login");
}
