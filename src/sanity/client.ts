import { createClient } from "next-sanity";

import { apiVersion, dataset, hasSanityConfig, projectId } from "./env";

export const sanityClient = hasSanityConfig
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  : null;

export async function sanityFetch<T>(query: string, fallback: T, params: Record<string, unknown> = {}) {
  if (!sanityClient) {
    return fallback;
  }

  try {
    const result = await sanityClient.fetch<T | null>(query, params);
    return result ?? fallback;
  } catch (error) {
    console.error("Sanity fetch failed", error);
    return fallback;
  }
}
