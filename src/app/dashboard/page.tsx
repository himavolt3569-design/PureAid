import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Activity, CreditCard, HandCoins, Search, Users } from "lucide-react";
import { getAuthenticatedProfile } from "@/lib/auth";
import { formatDate, formatMoney, progressPercent } from "@/lib/format";
import { DonorImpact } from "./donor-impact";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  status: string;
  raised_amount: number;
  goal_amount: number;
  created_at: string;
};

type ActiveCampaign = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  raised_amount: number;
  goal_amount: number;
  cover_image_url: string | null;
};

type Donation = {
  id: string;
  amount: number;
  donor_name: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  campaigns?: { title: string } | { title: string }[] | null;
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await getAuthenticatedProfile();

  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  const [{ data: campaigns }, { data: activeCampaignRows }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,title,status,raised_amount,goal_amount,created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id,title,summary,category,raised_amount,goal_amount,cover_image_url")
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(6),
  ]);

  const typedCampaigns = (campaigns ?? []) as Campaign[];
  const activeCampaignRowsTyped = (activeCampaignRows ?? []) as ActiveCampaign[];
  const campaignIds = typedCampaigns.map((campaign) => campaign.id);

  let donations: Donation[] = [];
  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from("donations")
      .select("id,amount,donor_name,is_anonymous,status,created_at,campaigns(title)")
      .in("campaign_id", campaignIds)
      .order("created_at", { ascending: false })
      .limit(6);

    donations = (data ?? []) as unknown as Donation[];
  }

  const totalRaised = typedCampaigns.reduce((sum, campaign) => sum + Number(campaign.raised_amount ?? 0), 0);
  const ownedActiveCampaigns = typedCampaigns.filter((campaign) => campaign.status === "active").length;
  const pendingCampaigns = typedCampaigns.filter((campaign) => campaign.status === "pending_verification").length;
  const isRecipient = profile.role === "recipient";

  let donorDonations: any[] = [];
  if (!isRecipient) {
    const { data } = await supabase
      .from("donations")
      .select("id,amount,status,created_at,campaigns(id,title,category)")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: true });
    donorDonations = data ?? [];
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="label-caps mb-3 text-slate-gray">{isRecipient ? "RECIPIENT OVERVIEW" : "DONOR OVERVIEW"}</p>
          <h1 className="headline-xl text-primary">{profile?.full_name ? `${profile.full_name}'s impact desk` : "Impact desk"}</h1>
          <p className="mt-2 text-slate-gray">{isRecipient ? "Track funds, review activity, and manage verified campaigns." : "Browse verified campaigns, review evidence, and message recipients before donating."}</p>
        </div>
        {isRecipient ? (
          <Link href="/dashboard/campaigns/create" className="label-caps inline-flex h-14 items-center justify-center rounded bg-primary px-8 text-paper-white hover:bg-vibrant-coral">
            New Campaign
          </Link>
        ) : (
          <Link href="/dashboard/discover" className="label-caps inline-flex h-14 items-center justify-center rounded bg-primary px-8 text-paper-white hover:bg-vibrant-coral">
            Explore Campaigns
          </Link>
        )}
      </div>

      {isRecipient ? (
        <section className="grid gap-5 md:grid-cols-4">
          <Metric label="Total funds received" value={formatMoney(totalRaised)} icon={HandCoins} />
          <Metric label="Donation records" value={String(donations.length)} icon={Users} />
          <Metric label="Your active campaigns" value={String(ownedActiveCampaigns)} icon={Activity} />
          <Metric label="Pending review" value={String(pendingCampaigns)} icon={CreditCard} />
        </section>
      ) : (
        <DonorImpact donations={donorDonations} donorName={profile.full_name ?? "Donor"} />
      )}

      <section className="bg-paper-white p-6 premium-shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="headline-md text-primary">Active campaigns</h2>
          <Link href="/dashboard/discover" className="label-caps text-primary hover:text-vibrant-coral">View all</Link>
        </div>
        {activeCampaignRowsTyped.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeCampaignRowsTyped.map((campaign) => {
              const percent = progressPercent(campaign.raised_amount, campaign.goal_amount);
              return (
                <Link key={campaign.id} href={`/dashboard/discover/${campaign.id}`} className="border border-surface-container bg-surface-container-low p-4 hover:border-primary">
                  <div className="mb-4 h-40 overflow-hidden bg-paper-white">
                    {campaign.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={campaign.cover_image_url} alt={campaign.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Search className="size-8 text-slate-gray" />
                      </div>
                    )}
                  </div>
                  <p className="label-caps text-slate-gray">{campaign.category}</p>
                  <h3 className="mt-2 font-semibold text-primary">{campaign.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-gray">{campaign.summary ?? "No summary provided."}</p>
                  <div className="mt-4 h-1 bg-surface-container-high">
                    <div className="h-full bg-forest-green" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-3 label-caps text-primary">{percent}% funded</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No active campaigns" body="Verified active campaigns will appear here for donors." />
        )}
      </section>

      {isRecipient ? <section className="grid gap-8 lg:grid-cols-12">
        <div className="bg-paper-white p-6 premium-shadow lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="headline-md text-primary">Campaign portfolio</h2>
            <Link href="/dashboard/campaigns" className="label-caps text-primary hover:text-vibrant-coral">Manage</Link>
          </div>
          {typedCampaigns.length > 0 ? (
            <div className="space-y-5">
              {typedCampaigns.slice(0, 4).map((campaign) => (
                <div key={campaign.id} className="border-b border-surface-container pb-5 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-primary">{campaign.title}</p>
                      <p className="mt-1 label-caps text-slate-gray">{campaign.status}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatMoney(campaign.raised_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No campaigns yet" body="Create your first verified campaign to begin receiving direct donations." />
          )}
        </div>

        <div className="bg-paper-white p-6 premium-shadow lg:col-span-5">
          <h2 className="headline-md mb-6 text-primary">Recent contributions</h2>
          {donations.length > 0 ? (
            <div className="space-y-5">
              {donations.map((donation) => (
                <div key={donation.id} className="border-b border-surface-container pb-5 last:border-b-0 last:pb-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-primary">{donation.is_anonymous ? "Anonymous donor" : donation.donor_name || "Donor"}</p>
                      <p className="mt-1 text-sm text-slate-gray">{campaignTitle(donation.campaigns)} · {formatDate(donation.created_at)}</p>
                    </div>
                    <p className="font-semibold text-forest-green">{formatMoney(donation.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No donation records" body="Donation intents and completed transfers will appear after donors use campaign payment methods." />
          )}
        </div>
      </section> : null}
    </div>
  );
}

function campaignTitle(campaign: Donation["campaigns"]) {
  if (Array.isArray(campaign)) {
    return campaign[0]?.title ?? "Campaign";
  }

  return campaign?.title ?? "Campaign";
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-paper-white p-6 premium-shadow">
      <div className="mb-8 flex items-center justify-between">
        <p className="label-caps text-slate-gray">{label}</p>
        <Icon className="size-5 text-primary" />
      </div>
      <p className="font-display text-5xl leading-none text-primary">{value}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-outline-variant p-8 text-center">
      <h3 className="font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-gray">{body}</p>
    </div>
  );
}
