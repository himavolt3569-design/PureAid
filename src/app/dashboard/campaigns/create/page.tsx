import { requireRecipient } from "@/lib/auth";
import { CreateCampaignForm } from "./create-campaign-form";

export const dynamic = "force-dynamic";

export default async function CreateCampaignPage() {
  await requireRecipient();

  return <CreateCampaignForm />;
}
