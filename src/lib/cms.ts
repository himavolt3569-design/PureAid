import { sanityFetch } from "@/sanity/client";

export type CmsLink = {
  label: string;
  href: string;
};

export type CmsCard = {
  label?: string;
  title: string;
  body?: string;
  icon?: string;
};

export type SiteContent = {
  brandName: string;
  seo: {
    title: string;
    description: string;
  };
  navigation: CmsLink[];
  searchLabel: string;
  loginLabel: string;
  primaryAction: CmsLink;
  footerLinks: CmsLink[];
};

export type HomeContent = {
  hero: {
    badge: string;
    headline: string;
    body: string;
    backgroundImageUrl: string;
    primaryCta: CmsLink;
    secondaryCta: CmsLink;
    featuredLabel: string;
    featuredCtaLabel: string;
    emptyTitle: string;
    emptyBody: string;
  };
  metrics: {
    activeCampaignsLabel: string;
    activeCampaignsDetail: string;
    recipientsLabel: string;
    recipientsDetail: string;
    raisedLabel: string;
    raisedDetailPrefix: string;
  };
  latestCampaigns: {
    heading: string;
    body: string;
  };
  campaignLabels: {
    collected: string;
    goal: string;
    noImage: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: CmsLink;
  };
  process: {
    heading: string;
    body: string;
    steps: CmsCard[];
  };
  causes: {
    heading: string;
    body: string;
    items: CmsCard[];
  };
  closingCta: {
    heading: string;
    body: string;
    primaryCta: CmsLink;
    secondaryCta: CmsLink;
  };
};

export type CampaignsContent = {
  intro: {
    eyebrow: string;
    heading: string;
    body: string;
  };
};

export const defaultSiteContent: SiteContent = {
  brandName: "PureAID",
  seo: {
    title: "PureAID | Verified Funding",
    description: "A premium, transparent donation platform connecting donors with verified recipients in Nepal.",
  },
  navigation: [
    { label: "Discover", href: "/campaigns" },
    { label: "Impact", href: "/dashboard" },
    { label: "Transparency", href: "/dashboard/settings" },
  ],
  searchLabel: "Search campaigns",
  loginLabel: "Login",
  primaryAction: { label: "Start a Campaign", href: "/signup" },
  footerLinks: [
    { label: "Find Causes", href: "/campaigns" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/dashboard/settings" },
  ],
};

export const defaultHomeContent: HomeContent = {
  hero: {
    badge: "100% Verified Causes",
    headline: "Helping others with real proof.",
    body: "PureAID helps you send money directly to people who need it for medical, school, or starting a small business in Nepal. We check all proof carefully so you know it's real.",
    backgroundImageUrl: "/hig_donation.png",
    primaryCta: { label: "Find Causes", href: "/campaigns" },
    secondaryCta: { label: "Ask for Help", href: "/signup" },
    featuredLabel: "Featured Choice",
    featuredCtaLabel: "Help Now",
    emptyTitle: "No active causes yet.",
    emptyBody: "Check back later to help!",
  },
  metrics: {
    activeCampaignsLabel: "Active causes",
    activeCampaignsDetail: "Live people needing help",
    recipientsLabel: "People checked",
    recipientsDetail: "Users we have verified",
    raisedLabel: "Money collected",
    raisedDetailPrefix: "Out of",
  },
  latestCampaigns: {
    heading: "Latest Causes.",
    body: "Every cause here has been checked by us. The money you give goes straight to them.",
  },
  campaignLabels: {
    collected: "collected",
    goal: "Goal",
    noImage: "No image",
    emptyTitle: "No active causes yet",
    emptyBody: "Be the first to ask for help, or wait for someone to post.",
    emptyCta: { label: "Ask for Help", href: "/dashboard/campaigns/create" },
  },
  process: {
    heading: "How it works.",
    body: "We make sure everything is safe and clear for you.",
    steps: [
      {
        label: "Proof",
        title: "People submit proof",
        body: "They upload ID cards, bills, and tell us exactly what they need the money for.",
        icon: "scan",
      },
      {
        label: "Check",
        title: "We check everything",
        body: "Our team and system carefully check the documents to make sure they are real.",
        icon: "shield",
      },
      {
        label: "Send",
        title: "You send money directly",
        body: "When you give, the money goes straight to their bank or phone wallet. No middleman.",
        icon: "wallet",
      },
    ],
  },
  causes: {
    heading: "Causes we support.",
    body: "We focus on helping with everyday real problems.",
    items: [
      {
        title: "Medical Help",
        body: "Money for hospital bills, medicine, and getting better.",
        icon: "medical",
      },
      {
        title: "Schooling",
        body: "Paying for school fees, books, and safe places to learn.",
        icon: "education",
      },
      {
        title: "Small Business",
        body: "Helping local people start a small shop or business to support their family.",
        icon: "business",
      },
    ],
  },
  closingCta: {
    heading: "Start helping today.",
    body: "Join us to ask for help or give to someone in need.",
    primaryCta: { label: "Join PureAID", href: "/signup" },
    secondaryCta: { label: "See Causes", href: "/campaigns" },
  },
};

export const defaultCampaignsContent: CampaignsContent = {
  intro: {
    eyebrow: "PUBLIC DISCOVERY",
    heading: "Campaign Map",
    body: "Explore verified campaigns making an impact. Our interactive map helps you find causes by region, urgency, and category.",
  },
};

export async function getSiteContent() {
  return sanityFetch<SiteContent>(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{
      "brandName": coalesce(brandName, $fallback.brandName),
      "seo": {
        "title": coalesce(seo.title, $fallback.seo.title),
        "description": coalesce(seo.description, $fallback.seo.description)
      },
      "navigation": coalesce(navigation[]{label, href}, $fallback.navigation),
      "searchLabel": coalesce(searchLabel, $fallback.searchLabel),
      "loginLabel": coalesce(loginLabel, $fallback.loginLabel),
      "primaryAction": coalesce(primaryAction{label, href}, $fallback.primaryAction),
      "footerLinks": coalesce(footerLinks[]{label, href}, $fallback.footerLinks)
    }`,
    defaultSiteContent,
    { fallback: defaultSiteContent }
  );
}

export async function getHomeContent() {
  return sanityFetch<HomeContent>(
    `*[_type == "homePage" && _id == "homePage"][0]{
      "hero": {
        "badge": coalesce(hero.badge, $fallback.hero.badge),
        "headline": coalesce(hero.headline, $fallback.hero.headline),
        "body": coalesce(hero.body, $fallback.hero.body),
        "backgroundImageUrl": coalesce(hero.backgroundImage.asset->url, $fallback.hero.backgroundImageUrl),
        "primaryCta": coalesce(hero.primaryCta{label, href}, $fallback.hero.primaryCta),
        "secondaryCta": coalesce(hero.secondaryCta{label, href}, $fallback.hero.secondaryCta),
        "featuredLabel": coalesce(hero.featuredLabel, $fallback.hero.featuredLabel),
        "featuredCtaLabel": coalesce(hero.featuredCtaLabel, $fallback.hero.featuredCtaLabel),
        "emptyTitle": coalesce(hero.emptyTitle, $fallback.hero.emptyTitle),
        "emptyBody": coalesce(hero.emptyBody, $fallback.hero.emptyBody)
      },
      "metrics": {
        "activeCampaignsLabel": coalesce(metrics.activeCampaignsLabel, $fallback.metrics.activeCampaignsLabel),
        "activeCampaignsDetail": coalesce(metrics.activeCampaignsDetail, $fallback.metrics.activeCampaignsDetail),
        "recipientsLabel": coalesce(metrics.recipientsLabel, $fallback.metrics.recipientsLabel),
        "recipientsDetail": coalesce(metrics.recipientsDetail, $fallback.metrics.recipientsDetail),
        "raisedLabel": coalesce(metrics.raisedLabel, $fallback.metrics.raisedLabel),
        "raisedDetailPrefix": coalesce(metrics.raisedDetailPrefix, $fallback.metrics.raisedDetailPrefix)
      },
      "latestCampaigns": {
        "heading": coalesce(latestCampaigns.heading, $fallback.latestCampaigns.heading),
        "body": coalesce(latestCampaigns.body, $fallback.latestCampaigns.body)
      },
      "campaignLabels": {
        "collected": coalesce(campaignLabels.collected, $fallback.campaignLabels.collected),
        "goal": coalesce(campaignLabels.goal, $fallback.campaignLabels.goal),
        "noImage": coalesce(campaignLabels.noImage, $fallback.campaignLabels.noImage),
        "emptyTitle": coalesce(campaignLabels.emptyTitle, $fallback.campaignLabels.emptyTitle),
        "emptyBody": coalesce(campaignLabels.emptyBody, $fallback.campaignLabels.emptyBody),
        "emptyCta": coalesce(campaignLabels.emptyCta{label, href}, $fallback.campaignLabels.emptyCta)
      },
      "process": {
        "heading": coalesce(process.heading, $fallback.process.heading),
        "body": coalesce(process.body, $fallback.process.body),
        "steps": coalesce(process.steps[]{label, title, body, icon}, $fallback.process.steps)
      },
      "causes": {
        "heading": coalesce(causes.heading, $fallback.causes.heading),
        "body": coalesce(causes.body, $fallback.causes.body),
        "items": coalesce(causes.items[]{label, title, body, icon}, $fallback.causes.items)
      },
      "closingCta": {
        "heading": coalesce(closingCta.heading, $fallback.closingCta.heading),
        "body": coalesce(closingCta.body, $fallback.closingCta.body),
        "primaryCta": coalesce(closingCta.primaryCta{label, href}, $fallback.closingCta.primaryCta),
        "secondaryCta": coalesce(closingCta.secondaryCta{label, href}, $fallback.closingCta.secondaryCta)
      }
    }`,
    defaultHomeContent,
    { fallback: defaultHomeContent }
  );
}

export async function getCampaignsContent() {
  return sanityFetch<CampaignsContent>(
    `*[_type == "campaignsPage" && _id == "campaignsPage"][0]{
      "intro": {
        "eyebrow": coalesce(intro.eyebrow, $fallback.intro.eyebrow),
        "heading": coalesce(intro.heading, $fallback.intro.heading),
        "body": coalesce(intro.body, $fallback.intro.body)
      }
    }`,
    defaultCampaignsContent,
    { fallback: defaultCampaignsContent }
  );
}
