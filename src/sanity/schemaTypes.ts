import { defineField, defineType } from "sanity";

const linkFields = [
  defineField({
    name: "label",
    title: "Label",
    type: "string",
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: "href",
    title: "Link",
    type: "string",
    validation: (Rule) => Rule.required(),
  }),
];

const linkType = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: linkFields,
});

const sectionHeadingType = defineType({
  name: "sectionHeading",
  title: "Section heading",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
  ],
});

const ctaType = defineType({
  name: "cta",
  title: "Call to action",
  type: "object",
  fields: linkFields,
});

const iconOptions = [
  { title: "Proof / scan", value: "scan" },
  { title: "Shield / verification", value: "shield" },
  { title: "Wallet / money", value: "wallet" },
  { title: "Medical", value: "medical" },
  { title: "Education", value: "education" },
  { title: "Business", value: "business" },
  { title: "Donation", value: "donation" },
  { title: "People", value: "people" },
  { title: "Map", value: "map" },
];

const editableCardType = defineType({
  name: "editableCard",
  title: "Editable card",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Small label", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: { list: iconOptions },
    }),
  ],
});

const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  initialValue: {
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
  },
  fields: [
    defineField({ name: "brandName", title: "Brand name", type: "string" }),
    defineField({
      name: "seo",
      title: "Default SEO",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
      ],
    }),
    defineField({
      name: "navigation",
      title: "Navigation links",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({ name: "searchLabel", title: "Search icon label", type: "string" }),
    defineField({ name: "loginLabel", title: "Login label", type: "string" }),
    defineField({
      name: "primaryAction",
      title: "Header primary action",
      type: "cta",
    }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [{ type: "link" }],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});

const homePageType = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  initialValue: {
    hero: {
      badge: "100% Verified Causes",
      headline: "Helping others with real proof.",
      body: "PureAID helps you send money directly to people who need it for medical, school, or starting a small business in Nepal. We check all proof carefully so you know it's real.",
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
  },
  fields: [
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        defineField({ name: "badge", title: "Badge", type: "string" }),
        defineField({ name: "headline", title: "Headline", type: "string" }),
        defineField({ name: "body", title: "Body", type: "text", rows: 4 }),
        defineField({ name: "backgroundImage", title: "Background image", type: "image", options: { hotspot: true } }),
        defineField({ name: "primaryCta", title: "Primary CTA", type: "cta" }),
        defineField({ name: "secondaryCta", title: "Secondary CTA", type: "cta" }),
        defineField({ name: "featuredLabel", title: "Featured campaign badge", type: "string" }),
        defineField({ name: "featuredCtaLabel", title: "Featured campaign CTA", type: "string" }),
        defineField({ name: "emptyTitle", title: "No featured title", type: "string" }),
        defineField({ name: "emptyBody", title: "No featured body", type: "text", rows: 2 }),
      ],
    }),
    defineField({
      name: "metrics",
      title: "Metric labels",
      type: "object",
      fields: [
        defineField({ name: "activeCampaignsLabel", title: "Active campaigns label", type: "string" }),
        defineField({ name: "activeCampaignsDetail", title: "Active campaigns detail", type: "string" }),
        defineField({ name: "recipientsLabel", title: "Recipients label", type: "string" }),
        defineField({ name: "recipientsDetail", title: "Recipients detail", type: "string" }),
        defineField({ name: "raisedLabel", title: "Raised money label", type: "string" }),
        defineField({ name: "raisedDetailPrefix", title: "Raised detail prefix", type: "string" }),
      ],
    }),
    defineField({ name: "latestCampaigns", title: "Latest campaigns section", type: "sectionHeading" }),
    defineField({
      name: "campaignLabels",
      title: "Campaign card labels",
      type: "object",
      fields: [
        defineField({ name: "collected", title: "Collected label", type: "string" }),
        defineField({ name: "goal", title: "Goal label", type: "string" }),
        defineField({ name: "noImage", title: "No image label", type: "string" }),
        defineField({ name: "emptyTitle", title: "Empty list title", type: "string" }),
        defineField({ name: "emptyBody", title: "Empty list body", type: "text", rows: 2 }),
        defineField({ name: "emptyCta", title: "Empty list CTA", type: "cta" }),
      ],
    }),
    defineField({
      name: "process",
      title: "Process section",
      type: "object",
      fields: [
        defineField({ name: "heading", title: "Heading", type: "string" }),
        defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
        defineField({ name: "steps", title: "Steps", type: "array", of: [{ type: "editableCard" }] }),
      ],
    }),
    defineField({
      name: "causes",
      title: "Causes section",
      type: "object",
      fields: [
        defineField({ name: "heading", title: "Heading", type: "string" }),
        defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
        defineField({ name: "items", title: "Cause cards", type: "array", of: [{ type: "editableCard" }] }),
      ],
    }),
    defineField({
      name: "closingCta",
      title: "Closing CTA",
      type: "object",
      fields: [
        defineField({ name: "heading", title: "Heading", type: "string" }),
        defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
        defineField({ name: "primaryCta", title: "Primary CTA", type: "cta" }),
        defineField({ name: "secondaryCta", title: "Secondary CTA", type: "cta" }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Home page" }),
  },
});

const campaignsPageType = defineType({
  name: "campaignsPage",
  title: "Campaigns page",
  type: "document",
  initialValue: {
    intro: {
      eyebrow: "PUBLIC DISCOVERY",
      heading: "Campaign Map",
      body: "Explore verified campaigns making an impact. Our interactive map helps you find causes by region, urgency, and category.",
    },
  },
  fields: [
    defineField({ name: "intro", title: "Intro", type: "sectionHeading" }),
  ],
  preview: {
    prepare: () => ({ title: "Campaigns page" }),
  },
});

export const schemaTypes = [
  linkType,
  ctaType,
  sectionHeadingType,
  editableCardType,
  siteSettingsType,
  homePageType,
  campaignsPageType,
];
