import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Landmark,
  MapPinned,
  ScanLine,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, progressPercent } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { TypewriterText } from "@/components/typewriter";
import { getSettings } from "@/lib/settings";
import { CmsCard, getHomeContent, getSiteContent, HomeContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  goal_amount: number;
  raised_amount: number;
  cover_image_url: string | null;
  verification_status: string;
};

const iconMap: Record<string, LucideIcon> = {
  business: BriefcaseBusiness,
  donation: HandHeart,
  education: GraduationCap,
  map: MapPinned,
  medical: HeartPulse,
  people: Users,
  scan: ScanLine,
  shield: ShieldCheck,
  wallet: WalletCards,
};

function iconFor(card: Pick<CmsCard, "icon">) {
  return iconMap[card.icon ?? ""] ?? ShieldCheck;
}

export default async function Home() {
  const supabase = await createClient();
  const [{ data: campaigns }, activeCountResult, recipientCountResult, homeContent, siteContent] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,title,summary,category,goal_amount,raised_amount,cover_image_url,verification_status")
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(6),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recipient"),
    getHomeContent(),
    getSiteContent(),
  ]);

  const activeCampaigns = (campaigns ?? []) as Campaign[];
  const settings = getSettings();
  
  // Use Super Admin's featured choice, otherwise fallback to first
  const featuredCampaign = activeCampaigns.find(c => c.id === settings.featuredCampaignId) || activeCampaigns[0]; 
  
  const totalRaised = activeCampaigns.reduce((sum, campaign) => sum + Number(campaign.raised_amount ?? 0), 0);
  const totalGoal = activeCampaigns.reduce((sum, campaign) => sum + Number(campaign.goal_amount ?? 0), 0);
  const activeCampaignCount = activeCountResult.count ?? activeCampaigns.length;
  const recipientCount = recipientCountResult.count ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main>
        {/* HIG HERO WITH BACKGROUND IMAGE & FEATURED CAMPAIGN */}
        <section className="relative min-h-[calc(100vh-88px)] flex flex-col items-center justify-center py-20 bg-deep-indigo">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={homeContent.hero.backgroundImageUrl} 
              alt="Giving hands" 
              className="w-full h-full object-cover opacity-40 blur-[2px] scale-105"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-deep-indigo/80 via-deep-indigo/60 to-deep-indigo" />
          </div>

          <div className="container-page relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="flex flex-col items-start text-left">
              <Reveal>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper-white/10 px-5 py-2.5 text-paper-white font-semibold text-sm backdrop-blur-xl border border-white/20 shadow-sm">
                  <BadgeCheck className="size-4" />
                  <span>{homeContent.hero.badge}</span>
                </div>
              </Reveal>

              <h1 className="text-5xl md:text-7xl lg:text-[72px] font-bold tracking-tight text-paper-white leading-[1.1] mb-6 min-h-[160px] md:min-h-[200px]">
                <TypewriterText text={homeContent.hero.headline} delay={0.2} />
              </h1>

              <Reveal delay={0.8}>
                <p className="max-w-xl text-lg md:text-xl leading-relaxed text-surface-container-low mb-10">
                  {homeContent.hero.body}
                </p>
              </Reveal>

              <Reveal delay={1.0}>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href={homeContent.hero.primaryCta.href} className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-paper-white font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(28,84,56,0.25)]">
                    {homeContent.hero.primaryCta.label}
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                  <Link href={homeContent.hero.secondaryCta.href} className="inline-flex h-14 items-center justify-center rounded-full bg-paper-white/10 px-8 text-paper-white font-semibold text-lg hover:bg-paper-white/20 backdrop-blur-md active:scale-[0.98] transition-all border border-white/20">
                    {homeContent.hero.secondaryCta.label}
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Featured Campaign (Super Admin Slot) */}
            <div className="w-full flex justify-center lg:justify-end">
              <Reveal delay={1.2}>
                <div className="relative w-full max-w-md bg-paper-white/10 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20">
                  {featuredCampaign ? (
                    <div className="flex flex-col gap-4">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-surface-container-low">
                        <div className="absolute top-3 right-3 z-10 bg-primary text-paper-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-lg">
                          {homeContent.hero.featuredLabel}
                        </div>
                        {featuredCampaign.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={featuredCampaign.cover_image_url} alt={featuredCampaign.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-deep-indigo/10 text-paper-white font-semibold">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-surface-container-low/80">{featuredCampaign.category}</span>
                        <h3 className="text-2xl font-bold text-paper-white leading-tight mt-1 mb-2">{featuredCampaign.title}</h3>
                        
                        <div className="mt-6">
                          <div className="flex justify-between text-sm font-semibold text-paper-white mb-2">
                            <span>{formatMoney(featuredCampaign.raised_amount)} {homeContent.campaignLabels.collected}</span>
                            <span>{progressPercent(featuredCampaign.raised_amount, featuredCampaign.goal_amount)}%</span>
                          </div>
                          <div className="h-3 bg-deep-indigo/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent(featuredCampaign.raised_amount, featuredCampaign.goal_amount)}%` }} />
                          </div>
                          <div className="text-xs text-surface-container-low/60 text-right mt-2">
                            {homeContent.campaignLabels.goal}: {formatMoney(featuredCampaign.goal_amount)}
                          </div>
                        </div>

                        <Link href={`/campaigns/${featuredCampaign.id}`} className="mt-6 w-full inline-flex h-12 items-center justify-center rounded-full bg-paper-white text-deep-indigo font-bold text-md hover:bg-surface-container-low transition-colors">
                          {homeContent.hero.featuredCtaLabel}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-paper-white">
                      <HeartPulse className="size-12 mx-auto mb-4 opacity-50" />
                      <p className="font-semibold">{homeContent.hero.emptyTitle}</p>
                      <p className="text-sm opacity-70 mt-2">{homeContent.hero.emptyBody}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

          </div>
        </section>

        {/* METRICS - Overlapping the Hero */}
        <section className="relative z-20 -mt-16 px-4 md:px-8">
          <div className="container-page flex justify-center">
            <Reveal>
              <div className="mx-auto flex flex-col md:flex-row gap-8 md:gap-20 items-center justify-center text-center w-full max-w-5xl bg-paper-white rounded-[2.5rem] p-10 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                <Metric label={homeContent.metrics.activeCampaignsLabel} value={String(activeCampaignCount)} detail={homeContent.metrics.activeCampaignsDetail} />
                <div className="w-full md:w-px h-px md:h-24 bg-outline-variant" />
                <Metric label={homeContent.metrics.recipientsLabel} value={String(recipientCount)} detail={homeContent.metrics.recipientsDetail} />
                <div className="w-full md:w-px h-px md:h-24 bg-outline-variant" />
                <Metric label={homeContent.metrics.raisedLabel} value={formatMoney(totalRaised)} detail={`${homeContent.metrics.raisedDetailPrefix} ${formatMoney(totalGoal)} needed`} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* GALLERY */}
        <section className="bg-gradient-to-b from-surface-container-low to-background py-20 px-4 md:px-8">
          <div className="container-page">
          <Reveal>
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-deep-indigo mb-4">{homeContent.latestCampaigns.heading}</h2>
              <p className="text-xl text-slate-gray leading-relaxed font-medium">
                {homeContent.latestCampaigns.body}
              </p>
            </div>
          </Reveal>

          {activeCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign, index) => (
                <Reveal key={campaign.id} delay={index * 0.1}>
                  <CampaignCard campaign={campaign} content={homeContent} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="mx-auto flex flex-col items-center justify-center text-center p-20 bg-paper-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 max-w-3xl">
                <Landmark className="size-16 text-slate-gray mb-6" />
                <h3 className="text-2xl font-bold text-deep-indigo mb-3">{homeContent.campaignLabels.emptyTitle}</h3>
                <p className="text-slate-gray max-w-md mb-8 text-lg">{homeContent.campaignLabels.emptyBody}</p>
                <Link href={homeContent.campaignLabels.emptyCta.href} className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-paper-white font-semibold text-lg hover:opacity-90 active:scale-[0.98] shadow-md">
                  {homeContent.campaignLabels.emptyCta.label}
                </Link>
              </div>
            </Reveal>
          )}
          </div>
        </section>

        {/* PROCESS */}
        <section className="bg-deep-indigo py-24 text-paper-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container-page relative z-10 max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{homeContent.process.heading}</h2>
                <p className="text-xl text-surface-container-low leading-relaxed font-medium">
                  {homeContent.process.body}
                </p>
              </div>
            </Reveal>
            
            <div className="grid gap-6 md:grid-cols-3">
              {homeContent.process.steps.map((step, index) => {
                const Icon = iconFor(step);
                return (
                  <Reveal key={step.title} delay={index * 0.1}>
                    <div className="flex flex-col items-center text-center bg-white/5 rounded-[2rem] p-10 backdrop-blur-xl border border-white/10 transition-transform hover:-translate-y-2">
                      <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary mb-8 shadow-inner border border-primary/30">
                        <Icon className="size-8 text-paper-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                      <p className="text-surface-container-low leading-relaxed text-lg font-medium">{step.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* CAUSES (Bento Grid Style) */}
        <section className="bg-background py-24 px-4 md:px-8">
          <div className="container-page max-w-6xl mx-auto">
          <Reveal>
            <div className="max-w-6xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-deep-indigo mb-4">{homeContent.causes.heading}</h2>
              <p className="text-xl text-slate-gray leading-relaxed font-medium">{homeContent.causes.body}</p>
            </div>
          </Reveal>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {homeContent.causes.items.map((cause, index) => {
              const Icon = iconFor(cause);
              // Make the first cause span 2 columns on large screens for a bento feel
              const isLarge = index === 0;
              return (
                <Reveal key={cause.title} delay={index * 0.1}>
                  <article className={`flex flex-col justify-center bg-surface-container-low rounded-[2rem] p-10 shadow-sm hover:shadow-md transition-all h-full border border-outline-variant/50 ${isLarge ? "lg:col-span-2 lg:flex-row lg:items-center lg:text-left gap-8 text-center" : "items-center text-center"}`}>
                    <div className={`flex items-center justify-center rounded-full bg-paper-white shadow-sm shrink-0 ${isLarge ? "size-24" : "size-16 mb-6"}`}>
                      <Icon className={`text-primary ${isLarge ? "size-10" : "size-8"}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-deep-indigo mb-3 ${isLarge ? "text-3xl" : "text-2xl"}`}>{cause.title}</h3>
                      <p className={`text-slate-gray font-medium leading-relaxed ${isLarge ? "text-lg max-w-md" : ""}`}>{cause.body}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface-container-low py-24 px-4 md:px-8 border-t border-outline-variant">
          <div className="container-page flex flex-col items-center text-center">
            <Reveal>
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-deep-indigo mb-6">{homeContent.closingCta.heading}</h2>
                <p className="text-xl text-slate-gray mb-12 font-medium">{homeContent.closingCta.body}</p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mx-auto flex flex-col gap-4 sm:flex-row w-full sm:w-auto justify-center">
                <Link href={homeContent.closingCta.primaryCta.href} className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-paper-white font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(28,84,56,0.25)]">
                  {homeContent.closingCta.primaryCta.label}
                </Link>
                <Link href={homeContent.closingCta.secondaryCta.href} className="inline-flex h-14 items-center justify-center rounded-full bg-surface-container-high px-10 text-deep-indigo font-semibold text-lg hover:bg-outline-variant active:scale-[0.98] transition-all">
                  {homeContent.closingCta.secondaryCta.label}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant">
        <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-bold text-2xl tracking-tight text-deep-indigo">{siteContent.brandName}</Link>
          <div className="flex flex-wrap gap-8 text-sm font-semibold text-slate-gray">
            {siteContent.footerLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col items-center p-4">
      <p className="text-sm font-bold tracking-wide text-primary uppercase mb-2">{label}</p>
      <p className="text-5xl md:text-6xl font-bold tracking-tight text-deep-indigo mb-2">{value}</p>
      <p className="text-sm text-slate-gray font-medium">{detail}</p>
    </div>
  );
}

function CampaignCard({ campaign, content }: { campaign: Campaign; content: HomeContent }) {
  const percent = progressPercent(campaign.raised_amount, campaign.goal_amount);

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group flex flex-col bg-paper-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all overflow-hidden border border-white/50 h-full"
    >
      <div className="relative overflow-hidden bg-surface-container aspect-[4/3]">
        {campaign.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.cover_image_url} alt={campaign.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-container-high p-7 text-center">
            <p className="text-xl font-bold text-slate-gray">{content.campaignLabels.noImage}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-8 flex-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">{campaign.category}</p>
          <h3 className="text-2xl font-bold text-deep-indigo leading-tight group-hover:text-primary transition-colors">{campaign.title}</h3>
          <p className="mt-4 line-clamp-3 text-slate-gray font-medium leading-relaxed">{campaign.summary}</p>
        </div>
        <div className="mt-8">
          <div className="flex justify-between text-sm font-bold text-deep-indigo mb-3">
            <span>{formatMoney(campaign.raised_amount)} {content.campaignLabels.collected}</span>
            <span className="text-slate-gray">{percent}%</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
