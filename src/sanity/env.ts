export const apiVersion = "2026-06-07";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const hasSanityConfig = Boolean(projectId && dataset);
