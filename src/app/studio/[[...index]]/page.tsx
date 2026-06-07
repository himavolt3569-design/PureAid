import Link from "next/link";
import { metadata, viewport } from "next-sanity/studio";

import { hasSanityConfig } from "@/sanity/env";
import { StudioClient } from "./studio-client";

export { metadata, viewport };

export default function StudioPage() {
  if (!hasSanityConfig) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <div className="max-w-xl border border-outline-variant bg-paper-white p-8 shadow-sm">
          <p className="label-caps mb-3 text-vibrant-coral">Sanity setup required</p>
          <h1 className="text-3xl font-bold text-primary">Connect PureAID to Sanity</h1>
          <p className="mt-4 text-slate-gray">
            Add NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to your environment, then restart the Next.js server.
          </p>
          <Link href="/" className="mt-8 inline-flex h-12 items-center justify-center rounded bg-primary px-6 text-sm font-semibold text-paper-white hover:bg-vibrant-coral">
            Back to site
          </Link>
        </div>
      </main>
    );
  }

  return <StudioClient />;
}
