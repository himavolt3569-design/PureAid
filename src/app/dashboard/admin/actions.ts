"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveSettings, getSettings } from "@/lib/settings";

export async function toggleStrictAiMode() {
  await requireAdmin();
  const current = getSettings();
  saveSettings({ strictAiMode: !current.strictAiMode });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function toggleNetworkPause() {
  await requireAdmin();
  const current = getSettings();
  saveSettings({ networkPause: !current.networkPause });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function publishAnnouncement(formData: FormData) {
  await requireAdmin();
  
  const heading = formData.get("heading") as string;
  const paragraph = formData.get("paragraph") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const isBold = formData.get("isBold") === "on";
  const isItalic = formData.get("isItalic") === "on";

  if (heading || paragraph) {
    saveSettings({
      announcement: {
        heading,
        paragraph,
        imageUrl: imageUrl || undefined,
        linkUrl: linkUrl || undefined,
        isBold,
        isItalic,
      }
    });
  } else {
    saveSettings({ announcement: null });
  }

  revalidatePath("/");
  revalidatePath("/dashboard/admin");
}

export async function clearAnnouncement() {
  await requireAdmin();
  saveSettings({ announcement: null });
  revalidatePath("/");
  revalidatePath("/dashboard/admin");
}

export async function setFeaturedCampaign(campaignId: string | null) {
  await requireAdmin();
  saveSettings({ featuredCampaignId: campaignId });
  revalidatePath("/");
  revalidatePath("/dashboard/admin");
}
