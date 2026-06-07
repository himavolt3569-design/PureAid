import Link from "next/link";
import { CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRecipient } from "@/lib/auth";
import { formatDate, formatMoney, progressPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  status: string;
  verification_status: string;
  raised_amount: number;
  goal_amount: number;
  created_at: string;
};

export default async function MyCampaignsPage() {
  const { supabase, user } = await requireRecipient();

  const { data } = await supabase
    .from("campaigns")
    .select("id,title,status,verification_status,raised_amount,goal_amount,created_at")
    .eq("recipient_id", user!.id)
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as Campaign[];

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="label-caps mb-3 text-slate-gray">CAMPAIGN MANAGEMENT</p>
          <h1 className="headline-xl text-primary">My Campaigns</h1>
          <p className="mt-2 text-slate-gray">Manage public pages, verification state, and direct funding progress.</p>
        </div>
        <Link href="/dashboard/campaigns/create">
          <Button>
            <Plus className="mr-2 size-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length > 0 ? (
        <div className="grid gap-5">
          {campaigns.map((campaign) => {
            const percent = progressPercent(campaign.raised_amount, campaign.goal_amount);
            return (
              <section key={campaign.id} className="bg-paper-white p-6 premium-shadow">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="headline-md text-primary">{campaign.title}</h2>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-gray">Created {formatDate(campaign.created_at)} · Verification {campaign.verification_status}</p>

                    <div className="mt-6 max-w-xl">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-gray">Raised</span>
                        <span className="font-semibold text-primary">{formatMoney(campaign.raised_amount)} / {formatMoney(campaign.goal_amount)}</span>
                      </div>
                      <div className="h-1 bg-surface-container-high">
                        <div className="h-full bg-forest-green" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                      <Button variant="outline" className="w-full sm:w-auto">Edit</Button>
                    </Link>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" className="w-full sm:w-auto">Public Page</Button>
                    </Link>
                    <Button variant="secondary" className="w-full sm:w-auto" disabled={campaign.status !== "active"}>
                      Request Withdrawal
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-outline-variant bg-paper-white p-12 text-center">
          <h2 className="headline-md text-primary">No campaigns created</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-gray">Create a campaign and submit verification details to publish your first funding page.</p>
          <Link href="/dashboard/campaigns/create" className="mt-8 inline-block">
            <Button>Create Campaign</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { icon: CheckCircle2, label: "Active", className: "border-forest-green text-forest-green" },
    pending_verification: { icon: Clock, label: "Pending Review", className: "border-vibrant-coral text-vibrant-coral" },
    rejected: { icon: XCircle, label: "Rejected", className: "border-destructive text-destructive" },
    draft: { icon: Clock, label: "Draft", className: "border-slate-gray text-slate-gray" },
    completed: { icon: CheckCircle2, label: "Completed", className: "border-primary text-primary" },
  }[status] ?? { icon: Clock, label: status, className: "border-slate-gray text-slate-gray" };

  const Icon = config.icon;
  return (
    <span className={`label-caps inline-flex items-center gap-2 rounded border px-3 py-1 ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}
