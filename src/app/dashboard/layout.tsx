import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HandCoins, LayoutDashboard, LifeBuoy, LogOut, MessageSquareText, Search, Settings, ShieldCheck } from "lucide-react";
import { ensureProfile } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfile(supabase, user);
  const canManageCampaigns = profile.role === "recipient";
  const isAdmin = profile.role === "admin";

  const navItems = isAdmin 
    ? [
        { href: "/dashboard/admin", label: "Superadmin Hub", icon: ShieldCheck },
        { href: "/dashboard/messages", label: "Messages", icon: MessageSquareText },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
      ]
    : [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/discover", label: "Active Campaigns", icon: Search },
        ...(canManageCampaigns
          ? [
              { href: "/dashboard/campaigns", label: "Campaigns", icon: HandCoins },
            ]
          : []),
        { href: "/dashboard/messages", label: "Messages", icon: MessageSquareText },
        { href: "/dashboard/support", label: "Help & Support", icon: LifeBuoy },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
      ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-surface-container bg-paper-white md:flex">
        <div className="flex h-[88px] shrink-0 items-center border-b border-surface-container px-8">
          <Link href="/" className="font-display text-5xl leading-none text-primary">
            PureAID
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-2 px-5 py-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex h-12 items-center gap-3 rounded px-4 text-sm font-semibold text-slate-gray hover:bg-surface-container-low hover:text-primary">
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-surface-container p-5">
          <p className="label-caps text-slate-gray">{profile?.role ?? "User"}</p>
          <p className="mt-2 truncate font-semibold text-primary">{profile?.full_name || user.email}</p>
          <form action={logout} className="mt-5">
            <button type="submit" className="flex h-10 w-full items-center gap-3 rounded border border-outline-variant px-3 text-sm font-semibold text-slate-gray hover:border-primary hover:text-primary">
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-surface-container bg-paper-white px-5 md:hidden">
          <Link href="/" className="font-display text-4xl text-primary">PureAID</Link>
          <Link href={isAdmin ? "/dashboard/admin" : "/dashboard/support"} className="label-caps text-primary">
            {isAdmin ? "Superadmin" : "Support"}
          </Link>
        </header>
        <div className="p-5 md:p-10">{children}</div>
      </main>
    </div>
  );
}
