import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "donor" | "recipient" | "admin";

export type AppProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function roleFromMetadata(value: unknown): Exclude<AppRole, "admin"> {
  return value === "recipient" || value === "donor" ? value : "donor";
}

function isSuperadminEmail(email: string | null | undefined) {
  if (!email) return false;

  const configuredEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return configuredEmails.includes(email.toLowerCase());
}

function textFromMetadata(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fallbackProfile(user: User): AppProfile {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: textFromMetadata(metadata.full_name),
    role: isSuperadminEmail(user.email) ? "admin" : roleFromMetadata(metadata.role),
  };
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function ensureProfile(supabase: SupabaseServerClient, user: User): Promise<AppProfile> {
  const fallback = fallbackProfile(user);
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Profile lookup failed:", selectError.message);
    return fallback;
  }

  if (existingProfile) {
    if (isSuperadminEmail(user.email) && existingProfile.role !== "admin") {
      const { data: promotedProfile, error: promoteError } = await supabase
        .from("profiles")
        .update({ role: "admin", verification_status: "verified" })
        .eq("id", user.id)
        .select("id,email,full_name,role")
        .single();

      if (promoteError) {
        console.error("Superadmin promotion failed:", promoteError.message);
        return existingProfile as AppProfile;
      }

      return promotedProfile as AppProfile;
    }

    return existingProfile as AppProfile;
  }

  const metadata = user.user_metadata ?? {};
  const profile = {
    id: user.id,
    email: user.email ?? null,
    full_name: textFromMetadata(metadata.full_name),
    phone_number: textFromMetadata(metadata.phone),
    role: isSuperadminEmail(user.email) ? "admin" : roleFromMetadata(metadata.role),
    verification_status: isSuperadminEmail(user.email) ? "verified" : "unsubmitted",
  };

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select("id,email,full_name,role")
    .single();

  if (error) {
    console.error("Profile creation failed:", error.message);
    return fallback;
  }

  return createdProfile as AppProfile;
}

export async function getAuthenticatedProfile() {
  const { supabase, user } = await getAuthenticatedUser();
  const profile = await ensureProfile(supabase, user);

  return { supabase, user, profile };
}

export async function requireRecipient() {
  const session = await getAuthenticatedProfile();

  if (session.profile.role !== "recipient") {
    redirect("/dashboard");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAuthenticatedProfile();

  if (session.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
