import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), ".pureaid-settings.json");

export type Announcement = {
  heading: string;
  paragraph: string;
  imageUrl?: string;
  linkUrl?: string;
  isBold?: boolean;
  isItalic?: boolean;
};

export type GlobalSettings = {
  strictAiMode: boolean;
  networkPause: boolean;
  announcement: Announcement | null;
  featuredCampaignId: string | null;
};

const defaultSettings: GlobalSettings = {
  strictAiMode: false,
  networkPause: false,
  announcement: null,
  featuredCampaignId: null,
};

export function getSettings(): GlobalSettings {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read settings", e);
  }
  return defaultSettings;
}

export function saveSettings(settings: Partial<GlobalSettings>) {
  const current = getSettings();
  const next = { ...current, ...settings };
  try {
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
  } catch (e) {
    console.error("Failed to write settings", e);
  }
}
