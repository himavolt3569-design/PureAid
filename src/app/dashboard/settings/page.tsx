import { getAuthenticatedProfile } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

type PaymentMethod = {
  provider: string;
  display_name: string | null;
  qr_image_url: string | null;
  account_reference: string | null;
  is_active: boolean;
};

export default async function SettingsPage() {
  const { supabase, user, profile: authProfile } = await getAuthenticatedProfile();
  const canManagePayments = authProfile.role === "recipient";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,phone_number,organization_name,location,bio,verification_status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: methods } = canManagePayments
    ? await supabase
        .from("recipient_payment_methods")
        .select("provider,display_name,qr_image_url,account_reference,is_active")
        .eq("profile_id", user.id)
    : { data: [] };

  return (
    <SettingsForm
      userId={user.id}
      userEmail={user.email ?? null}
      role={authProfile.role}
      profile={profile}
      paymentMethods={(methods ?? []) as PaymentMethod[]}
    />
  );
}
