import { createClient } from "@supabase/supabase-js";
import { DiscoverInteractive } from "@/components/discover/DiscoverInteractive";
import { Navbar } from "@/components/navbar";
import { getCampaignsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  goal_amount: number;
  raised_amount: number;
  cover_image_url: string | null;
  location: string | null;
  verification_status: string;
  recipient?: {
    full_name: string | null;
    organization_name: string | null;
  } | {
    full_name: string | null;
    organization_name: string | null;
  }[] | null;
};

export default async function CampaignsPage() {
  const content = await getCampaignsContent();

  // Use anon client for public access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch all active campaigns for client-side filtering and mapping
  const { data } = await supabase
    .from("campaigns")
    .select("id,title,summary,category,goal_amount,raised_amount,cover_image_url,location,verification_status,recipient:profiles!campaigns_recipient_id_fkey(full_name,organization_name)")
    .eq("status", "active")
    .order("published_at", { ascending: false });

  const campaigns = (data ?? []) as Campaign[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container-page pt-32 space-y-8">
        <div>
          <p className="label-caps mb-3 text-vibrant-coral">{content.intro.eyebrow}</p>
          <h1 className="display-title text-primary tracking-tight">{content.intro.heading}</h1>
          <p className="mt-4 max-w-2xl text-slate-gray text-lg leading-relaxed">
            {content.intro.body}
          </p>
        </div>

        <DiscoverInteractive initialCampaigns={campaigns} />
      </main>
    </div>
  );
}
