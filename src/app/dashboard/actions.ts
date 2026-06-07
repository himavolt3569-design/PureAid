"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getAuthenticatedProfile, requireAdmin, requireRecipient } from "@/lib/auth";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" && entry.trim() ? entry.trim() : null;
}

export async function saveSettings(formData: FormData) {
  const { supabase, user, profile } = await getAuthenticatedProfile();
  const canManagePayments = profile.role === "recipient";

  const fullName = value(formData, "fullName");
  const phoneNumber = value(formData, "phoneNumber");
  const organizationName = value(formData, "organizationName");
  const location = value(formData, "location");
  const bio = value(formData, "bio");

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    phone_number: phoneNumber,
    organization_name: organizationName,
    location,
    bio,
    role: profile.role,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const providers = ["esewa", "khalti", "imepay", "bank"] as const;
  const paymentRows = providers
    .map((provider) => ({
      profile_id: user.id,
      provider,
      display_name: value(formData, `${provider}Name`),
      qr_image_url: value(formData, `${provider}QrUrl`),
      account_reference: value(formData, `${provider}Reference`),
      is_active: Boolean(value(formData, `${provider}QrUrl`) || value(formData, `${provider}Reference`)),
    }))
    .filter((row) => row.display_name || row.qr_image_url || row.account_reference);

  if (canManagePayments && paymentRows.length > 0) {
    const { error: paymentError } = await supabase
      .from("recipient_payment_methods")
      .upsert(paymentRows, { onConflict: "profile_id,provider" });

    if (paymentError) {
      throw new Error(paymentError.message);
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/campaigns");
}

export async function createCampaign(formData: FormData) {
  const { supabase, user } = await requireRecipient();

  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const goalAmount = Number(value(formData, "goalAmount"));

  if (!title || !description || !category || !Number.isFinite(goalAmount) || goalAmount <= 0) {
    return { error: "Campaign title, category, description, and a valid goal amount are required." };
  }

  const verificationStatus = value(formData, "verificationPassed") === "true" ? "verified" : "in_review";
  const status = verificationStatus === "verified" ? "active" : "pending_verification";

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      recipient_id: user.id,
      title,
      summary: value(formData, "summary"),
      description,
      category,
      goal_amount: goalAmount,
      cover_image_url: value(formData, "coverImageUrl"),
      location: value(formData, "location"),
      impact_statement: value(formData, "impactStatement"),
      status,
      verification_status: verificationStatus,
      published_at: status === "active" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const confidence = Number(value(formData, "verificationConfidence"));
  const excerpt = value(formData, "ocrExcerpt");

  if (campaign) {
    const filesToUpload = [
      { file: formData.get("primaryDocument") as File | null, type: category },
      { file: formData.get("citizenshipDocument") as File | null, type: "citizenship" },
      { file: formData.get("panVatDocument") as File | null, type: "tax" },
    ];

    for (const { file, type } of filesToUpload) {
      if (file && file.size > 0) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
        const safeName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
        const path = `${user.id}/${crypto.randomUUID()}-${safeName || "doc"}.${extension}`;

        const { error: uploadError } = await supabase.storage.from("campaign-documents").upload(path, file, {
          contentType: file.type || undefined,
        });

        if (!uploadError) {
          await supabase.from("documents").insert({
            campaign_id: campaign.id,
            profile_id: user.id,
            file_url: path,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            document_type: type,
            ai_confidence_score: type === category && Number.isFinite(confidence) ? confidence : null,
            ocr_excerpt: type === category ? excerpt : null,
            status: verificationStatus === "verified" ? "verified" : "pending",
          });
        }
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/campaigns");
  redirect("/dashboard/campaigns");
}

export async function editCampaign(formData: FormData) {
  const { supabase, user } = await requireRecipient();

  const campaignId = value(formData, "campaignId");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const goalAmount = Number(value(formData, "goalAmount"));

  if (!campaignId) {
    return { error: "Campaign ID is required." };
  }

  if (!title || !description || !category || !Number.isFinite(goalAmount) || goalAmount <= 0) {
    return { error: "Campaign title, category, description, and a valid goal amount are required." };
  }

  // Find existing campaign
  const { data: existingCampaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("id, recipient_id")
    .eq("id", campaignId)
    .single();

  if (fetchError || !existingCampaign || existingCampaign.recipient_id !== user.id) {
    return { error: "Campaign not found or access denied." };
  }

  const { error } = await supabase
    .from("campaigns")
    .update({
      title,
      summary: value(formData, "summary"),
      description,
      category,
      goal_amount: goalAmount,
      cover_image_url: value(formData, "coverImageUrl") || null,
      location: value(formData, "location"),
      impact_statement: value(formData, "impactStatement"),
      status: "pending_verification",
      verification_status: "in_review",
    })
    .eq("id", campaignId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  redirect("/dashboard/campaigns");
}

export async function createDonationIntent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfile(supabase, user);
  }

  const campaignId = value(formData, "campaignId");
  const amount = Number(value(formData, "amount"));
  const paymentMethod = value(formData, "paymentMethod");

  if (!campaignId || !paymentMethod || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Donation amount and payment method are required." };
  }

  const { error } = await supabase.from("donations").insert({
    campaign_id: campaignId,
    donor_id: user?.id ?? null,
    donor_name: value(formData, "donorName"),
    donor_email: value(formData, "donorEmail") ?? user?.email ?? null,
    amount,
    payment_method: paymentMethod,
    is_anonymous: value(formData, "isAnonymous") === "on",
    note: value(formData, "note"),
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/dashboard/discover/${campaignId}`);
  return { ok: true };
}

export async function startCampaignConversation(formData: FormData) {
  const { supabase, user } = await getAuthenticatedProfile();
  const campaignId = value(formData, "campaignId");

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id,recipient_id,title,status")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.recipient_id === user.id) {
    redirect("/dashboard/messages");
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id,conversation_participants!inner(profile_id)")
    .eq("campaign_id", campaign.id)
    .eq("conversation_participants.profile_id", user.id)
    .limit(10);

  const existingConversationId = (existing ?? []).find((conversation) => {
    const participants = conversation.conversation_participants as { profile_id: string }[] | null;
    return participants?.some((participant) => participant.profile_id === user.id);
  })?.id;

  if (existingConversationId) {
    redirect(`/dashboard/messages?conversation=${existingConversationId}`);
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      campaign_id: campaign.id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const participants = Array.from(new Set([user.id, campaign.recipient_id])).map((profileId) => ({
    conversation_id: conversation.id,
    profile_id: profileId,
  }));

  const { error: participantError } = await supabase.from("conversation_participants").insert(participants);

  if (participantError) {
    throw new Error(participantError.message);
  }

  revalidatePath("/dashboard/messages");
  redirect(`/dashboard/messages?conversation=${conversation.id}`);
}

export async function sendMessage(formData: FormData) {
  const { supabase, user } = await getAuthenticatedProfile();
  const conversationId = value(formData, "conversationId");
  const body = value(formData, "body");
  const messageId = value(formData, "id");

  if (!conversationId || !body) {
    throw new Error("Conversation and message are required.");
  }

  const payload: any = {
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  };
  
  if (messageId) {
    payload.id = messageId;
  }

  const { error } = await supabase.from("messages").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  revalidatePath("/dashboard/messages");
}

export async function reviewCampaign(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const campaignId = value(formData, "campaignId");
  const decision = value(formData, "decision");
  const note = value(formData, "note");

  if (!campaignId || !decision) {
    throw new Error("Campaign and decision are required.");
  }

  const approved = decision === "approve";
  const rejected = decision === "reject";
  const needsReview = decision === "review";

  if (!approved && !rejected && !needsReview) {
    throw new Error("Unsupported campaign decision.");
  }

  const nextStatus = approved ? "active" : rejected ? "rejected" : "pending_verification";
  const nextVerificationStatus = approved ? "verified" : rejected ? "rejected" : "in_review";

  const { error } = await supabase
    .from("campaigns")
    .update({
      status: nextStatus,
      verification_status: nextVerificationStatus,
      published_at: approved ? new Date().toISOString() : null,
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("documents")
    .update({ status: approved ? "verified" : rejected ? "rejected" : "pending" })
    .eq("campaign_id", campaignId);

  await supabase.from("campaign_activity").insert({
    campaign_id: campaignId,
    actor_id: user.id,
    activity_type: `admin_${decision}`,
    message: note ?? `Campaign ${nextVerificationStatus} by admin.`,
    metadata: { decision, verification_status: nextVerificationStatus },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function reviewProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = value(formData, "profileId");
  const decision = value(formData, "decision");

  if (!profileId || !decision) {
    throw new Error("Profile and decision are required.");
  }

  const nextVerificationStatus =
    decision === "approve" ? "verified" : decision === "reject" ? "rejected" : decision === "review" ? "in_review" : null;

  if (!nextVerificationStatus) {
    throw new Error("Unsupported profile decision.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: nextVerificationStatus })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/settings");
}

export async function updateProfileRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const profileId = value(formData, "profileId");
  const role = value(formData, "role");

  if (!profileId || !role) {
    throw new Error("Profile and role are required.");
  }

  if (!["donor", "recipient", "admin"].includes(role)) {
    throw new Error("Unsupported user role.");
  }

  if (profileId === user.id && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
}

export async function updateDonationStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const donationId = value(formData, "donationId");
  const status = value(formData, "status");

  if (!donationId || !status) {
    throw new Error("Donation and status are required.");
  }

  if (!["pending", "successful", "failed", "cancelled"].includes(status)) {
    throw new Error("Unsupported donation status.");
  }

  const { error } = await supabase.from("donations").update({ status }).eq("id", donationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
}

export async function createSupportTicket(formData: FormData) {
  const { supabase, user, profile } = await getAuthenticatedProfile();
  const subject = value(formData, "subject");
  const category = value(formData, "category") ?? "general";
  const message = value(formData, "message");

  if (!subject || !message) {
    throw new Error("Subject and message are required.");
  }

  const { error } = await supabase.from("support_tickets").insert({
    requester_id: user.id,
    requester_email: profile.email ?? user.email ?? null,
    subject,
    category,
    message,
    status: "open",
    priority: "normal",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/admin");
}

export async function updateSupportTicket(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const ticketId = value(formData, "ticketId");
  const status = value(formData, "status");
  const priority = value(formData, "priority");
  const adminNotes = value(formData, "adminNotes");

  if (!ticketId || !status || !priority) {
    throw new Error("Ticket, status, and priority are required.");
  }

  if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
    throw new Error("Unsupported support status.");
  }

  if (!["low", "normal", "high", "urgent"].includes(priority)) {
    throw new Error("Unsupported support priority.");
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      priority,
      admin_notes: adminNotes,
      assigned_admin_id: user.id,
      resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
    })
    .eq("id", ticketId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/support");
}

export async function deleteCampaign(formData: FormData) {
  const { supabase } = await requireAdmin();
  const campaignId = value(formData, "campaignId");
  if (!campaignId) throw new Error("Campaign ID required");
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin");
  revalidatePath("/campaigns");
}

export async function deleteProfile(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const profileId = value(formData, "profileId");
  if (!profileId) throw new Error("Profile ID required");
  if (profileId === user.id) throw new Error("You cannot delete your own admin profile.");
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin");
}

export async function deleteDonation(formData: FormData) {
  const { supabase } = await requireAdmin();
  const donationId = value(formData, "donationId");
  if (!donationId) throw new Error("Donation ID required");
  const { error } = await supabase.from("donations").delete().eq("id", donationId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin");
}
