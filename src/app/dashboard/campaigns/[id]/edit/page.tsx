import { requireRecipient } from "@/lib/auth";
import { EditCampaignForm } from "./edit-campaign-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireRecipient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign || campaign.recipient_id !== user.id) {
    notFound();
  }

  return <EditCampaignForm campaign={campaign} />;
}
