import { getAuthenticatedProfile } from "@/lib/auth";
import { DiscoverInteractive } from "@/components/discover/DiscoverInteractive";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { supabase } = await getAuthenticatedProfile();

  // Fetch all active campaigns for client-side filtering and mapping
  const { data } = await supabase
    .from("campaigns")
    .select("id,title,summary,category,goal_amount,raised_amount,cover_image_url,location,verification_status,recipient:profiles!campaigns_recipient_id_fkey(full_name,organization_name)")
    .eq("status", "active")
    .order("published_at", { ascending: false });

  const campaigns = (data ?? []) as any[];

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <div>
        <p className="label-caps mb-3 text-slate-gray">DONOR DISCOVERY</p>
        <h1 className="headline-xl text-primary">Interactive Map Search</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">
          Discover verified campaigns across regions. Review details, track goal progress, and find where your support is needed most.
        </p>
      </div>

      <DiscoverInteractive initialCampaigns={campaigns} />
    </div>
  );
}
