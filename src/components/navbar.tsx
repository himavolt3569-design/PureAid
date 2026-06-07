import Link from "next/link";
import { Search } from "lucide-react";
import { getSiteContent } from "@/lib/cms";

export async function Navbar() {
  const content = await getSiteContent();

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-paper-white/95 backdrop-blur-md">
      <div className="container-page flex h-[88px] items-center justify-between">
        <Link href="/" className="font-display text-[32px] leading-none text-primary hover:text-vibrant-coral md:text-5xl">
          {content.brandName}
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-semibold tracking-wide text-slate-gray md:flex">
          <Link href="/discover" className="hover:text-primary">Discover</Link>
          <Link href="/impact" className="hover:text-primary">Impact</Link>
          <Link href="/transparency" className="hover:text-primary">Transparency</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/discover" aria-label="Search campaigns" className="hidden text-primary hover:text-vibrant-coral md:inline-flex">
            <Search className="size-5" />
          </Link>
          <Link href="/login" className="hidden text-sm font-semibold text-slate-gray hover:text-primary sm:inline">
            {content.loginLabel}
          </Link>
          <Link href={content.primaryAction.href} className="label-caps inline-flex h-14 items-center justify-center rounded bg-primary px-5 text-paper-white hover:bg-vibrant-coral md:px-8">
            {content.primaryAction.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
