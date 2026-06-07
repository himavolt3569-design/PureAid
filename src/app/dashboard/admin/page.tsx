import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, profile } = await getAuthenticatedProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [
    campaignResult,
    { data: allProfiles },
    { data: allPaymentMethods },
    { data: allDonations },
    { data: openTickets },
    { count: totalUsers },
    { count: totalDonors },
    { count: totalRecipients },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,title,summary,description,recipient_id,category,goal_amount,raised_amount,cover_image_url,location,impact_statement,status,verification_status,published_at,created_at,recipient:profiles!campaigns_recipient_id_fkey(full_name,email,phone_number,organization_name,location,bio,verification_status,created_at),documents(id,file_name,file_url,mime_type,document_type,ocr_excerpt,ai_confidence_score,status,created_at)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("id,email,full_name,organization_name,role,verification_status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("recipient_payment_methods")
      .select("profile_id,provider,display_name,qr_image_url,account_reference,is_active")
      .order("provider", { ascending: true }),
    supabase
      .from("donations")
      .select("id,amount,payment_method,donor_name,donor_email,status,transaction_id,created_at,campaigns(title)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("support_tickets")
      .select("id,requester_email,subject,category,message,status,priority,admin_notes,created_at")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "donor"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recipient"),
  ]);

  if (campaignResult.error) {
    console.error("Admin campaign query failed:", campaignResult.error.message);
  }

  const allCampaigns = await Promise.all(
    (campaignResult.data ?? []).map(async (campaign) => ({
      ...campaign,
      documents: await Promise.all(
        (campaign.documents ?? []).map(async (document) => {
          if (!document.file_url) {
            return { ...document, signed_url: null };
          }

          if (/^https?:\/\//i.test(document.file_url)) {
            return { ...document, signed_url: document.file_url };
          }

          const { data } = await supabase.storage.from("campaign-documents").createSignedUrl(document.file_url, 60 * 60);
          return { ...document, signed_url: data?.signedUrl ?? null };
        })
      ),
    }))
  );
  const campaigns = allCampaigns ?? [];
  const activeCampaigns = campaigns.filter(c => c.status === "active");

  const stats = {
    totalUsers: totalUsers ?? 0,
    totalDonors: totalDonors ?? 0,
    totalRecipients: totalRecipients ?? 0,
    activeCampaigns: activeCampaigns.length,
    totalRaised: activeCampaigns.reduce((sum, c) => sum + Number(c.raised_amount ?? 0), 0),
    totalGoal: activeCampaigns.reduce((sum, c) => sum + Number(c.goal_amount ?? 0), 0),
  };

  const settings = getSettings();

  return (
    <AdminPanel 
      role={profile.role} 
      stats={stats}
      settings={settings}
      allCampaigns={campaigns}
      allProfiles={allProfiles ?? []}
      allPaymentMethods={allPaymentMethods ?? []}
      allDonations={allDonations ?? []}
      openTickets={openTickets ?? []}
    />
  );
}
