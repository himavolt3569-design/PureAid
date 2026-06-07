"use client";

import { useState, useTransition, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BadgeCheck, CircleDollarSign, LifeBuoy, UserCheck, DatabaseZap, GlobeLock, Megaphone, ZapOff, Trash2, ChevronDown, ChevronUp, BarChart3, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  reviewCampaign, reviewProfile, updateDonationStatus, 
  updateSupportTicket, updateProfileRole, 
  deleteCampaign, deleteProfile, deleteDonation, startCampaignConversation
} from "@/app/dashboard/actions";
import { toggleStrictAiMode, toggleNetworkPause, publishAnnouncement, clearAnnouncement, setFeaturedCampaign } from "./actions";
import { formatDate, formatMoney } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { GlobalSettings } from "@/lib/settings";

type Campaign = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  recipient_id: string;
  category: string;
  goal_amount: string | number | null;
  raised_amount: string | number | null;
  cover_image_url: string | null;
  location: string | null;
  impact_statement: string | null;
  status: string;
  verification_status: string | null;
  published_at: string | null;
  created_at: string | null;
  recipient?: RecipientProfile | RecipientProfile[] | null;
  documents?: DocumentRow[];
};

type RecipientProfile = {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  organization_name: string | null;
  location: string | null;
  bio: string | null;
  verification_status: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  organization_name: string | null;
  role: string;
  verification_status: string;
  created_at: string | null;
};

type DonationRow = {
  id: string;
  amount: string | number | null;
  payment_method: string;
  donor_name: string | null;
  donor_email: string | null;
  status: string;
  created_at: string | null;
  campaigns?: { title: string | null } | { title: string | null }[] | null;
};

type TicketRow = {
  id: string;
  requester_email: string | null;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string | null;
};

type PaymentMethodRow = {
  profile_id: string;
  provider: string;
  display_name: string | null;
  qr_image_url: string | null;
  account_reference: string | null;
  is_active: boolean;
};

type DocumentRow = {
  id: string;
  file_name: string | null;
  file_url: string | null;
  signed_url?: string | null;
  mime_type: string | null;
  document_type: string | null;
  ocr_excerpt: string | null;
  ai_confidence_score: string | number | null;
  status: string | null;
  created_at: string | null;
};

type GlobalStats = {
  totalUsers: number;
  totalDonors: number;
  totalRecipients: number;
  activeCampaigns: number;
  totalRaised: number;
  totalGoal: number;
};

export function AdminPanel({
  stats,
  settings,
  allCampaigns = [],
  allProfiles = [],
  allPaymentMethods = [],
  allDonations = [],
  openTickets = []
}: {
  role: string;
  stats: GlobalStats;
  settings: GlobalSettings;
  allCampaigns: Campaign[];
  allProfiles: ProfileRow[];
  allPaymentMethods: PaymentMethodRow[];
  allDonations: DonationRow[];
  openTickets: TicketRow[];
}) {
  const [activeTab, setActiveTab] = useState("control");
  const [isPending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);

  const handleSetFeatured = (campaignId: string) => {
    startTransition(async () => {
      try {
        await setFeaturedCampaign(campaignId);
        toast.success("Campaign set as featured on landing page");
      } catch (e) {
        toast.error("Failed to set featured campaign");
      }
    });
  };

  useGSAP(() => {
    gsap.fromTo(
      ".gsap-item",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out" }
    );
  }, { scope: container, dependencies: [activeTab] });

  // Modals and States
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [reportRange, setReportRange] = useState("1M");

  const pendingCampaigns = allCampaigns.filter(isCampaignPending);
  const paymentMethodsByProfile = allPaymentMethods.reduce<Record<string, PaymentMethodRow[]>>((map, method) => {
    map[method.profile_id] = [...(map[method.profile_id] ?? []), method];
    return map;
  }, {});

  const tabs = [
    { id: "control", label: "Control Center", icon: DatabaseZap },
    { id: "campaigns", label: "Verification Queue", icon: BadgeCheck, count: pendingCampaigns.length },
    { id: "users", label: "Users & Roles", icon: UserCheck },
    { id: "donations", label: "Donation Ledger", icon: CircleDollarSign },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "support", label: "Support Desk", icon: LifeBuoy, count: openTickets.length },
  ];

  const generateChartData = () => {
    const successfulDonations = allDonations.filter((donation) => donation.status === "successful");
    const buckets = new Map<string, number>();

    successfulDonations.forEach((donation) => {
      const date = donation.created_at ? new Date(donation.created_at) : null;
      const key = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-NP", { month: "short", day: "numeric" }) : "Unknown";
      buckets.set(key, (buckets.get(key) ?? 0) + Number(donation.amount ?? 0));
    });

    return Array.from(buckets, ([name, total]) => ({ name, total })).slice(-8);
  };

  return (
    <div ref={container} className="mx-auto max-w-[1400px] space-y-10">
      <header className="gsap-item flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="headline-xl text-primary">Platform Command</h1>
          <p className="mt-2 max-w-3xl text-slate-gray">
            Complete oversight of the PureAID ecosystem. Manage approvals, oversee transactions, and implement global platform directives.
          </p>
        </div>
      </header>

      {/* Custom Premium Tabs */}
      <nav className="gsap-item flex flex-wrap gap-2 border-b border-surface-container">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 border-b-2 px-6 py-4 text-sm font-semibold transition-colors ${
                isActive ? "border-primary text-primary bg-surface-container-low" : "border-transparent text-slate-gray hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-primary text-paper-white" : "bg-surface-container-high text-primary"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <main className="min-h-[500px]">
        {activeTab === "control" && (
          <div className="space-y-8">
            <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="gsap-item"><MetricCard label="Total Raised" value={formatMoney(stats.totalRaised)} detail={`Goal: ${formatMoney(stats.totalGoal)}`} /></div>
              <div className="gsap-item"><MetricCard label="Active Campaigns" value={String(stats.activeCampaigns)} detail="Live on platform" /></div>
              <div className="gsap-item"><MetricCard label="Registered Donors" value={String(stats.totalDonors)} detail={`Out of ${stats.totalUsers} users`} /></div>
              <div className="gsap-item"><MetricCard label="Verified Recipients" value={String(stats.totalRecipients)} detail="Approved organizations" /></div>
            </section>

            <section className="form-panel gsap-item">
              <div className="form-section-heading border-b border-surface-container pb-5">
                <div>
                  <h2 className="headline-md text-primary">Huge Implementations</h2>
                  <p className="mt-1 text-sm text-slate-gray">Powerful, system-wide overrides available exclusively to Superadmins.</p>
                </div>
                <DatabaseZap className="size-6 text-primary" />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                
                {/* Strict AI Mode */}
                <div className="flex flex-col gap-4 border border-surface-container bg-surface-container-low p-6 transition-all hover:border-primary">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <GlobeLock className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Strict AI Mode</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-gray">Automatically reject campaigns with AI confidence below 90% without human review.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
                    <span className={`text-sm font-semibold ${settings.strictAiMode ? "text-forest-green" : "text-slate-gray"}`}>
                      Status: {settings.strictAiMode ? "Enabled" : "Disabled"}
                    </span>
                    <Button 
                      variant={settings.strictAiMode ? "outline" : "secondary"} 
                      onClick={() => {
                        startTransition(async () => {
                          await toggleStrictAiMode();
                          toast.success(settings.strictAiMode ? "Strict AI Mode Disabled" : "Strict AI Mode Enabled");
                        });
                      }}
                      disabled={isPending}
                    >
                      {settings.strictAiMode ? "Disable Strict Mode" : "Enable Strict Mode"}
                    </Button>
                  </div>
                </div>

                {/* Global Announcement */}
                <div className="flex flex-col gap-4 border border-surface-container bg-surface-container-low p-6 transition-all hover:border-primary">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <Megaphone className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Global Announcement</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-gray">Push a mandatory rich-text banner to all active users on the platform.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
                    <span className={`text-sm font-semibold ${settings.announcement ? "text-vibrant-coral" : "text-slate-gray"}`}>
                      Status: {settings.announcement ? "Broadcasting" : "Idle"}
                    </span>
                    <div className="flex gap-2">
                      {settings.announcement && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            startTransition(async () => {
                              await clearAnnouncement();
                              toast.success("Broadcast cleared.");
                            });
                          }}
                          disabled={isPending}
                        >
                          Clear
                        </Button>
                      )}
                      <Button variant="secondary" onClick={() => setShowAnnouncementModal(true)}>
                        {settings.announcement ? "Edit Broadcast" : "Draft Broadcast"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Emergency Pause */}
                <div className="flex flex-col gap-4 border border-destructive/20 bg-destructive/5 p-6 transition-all hover:border-destructive/50 lg:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                      <ZapOff className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-destructive">Emergency Network Pause</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-gray">Instantly freeze all new campaign publications and new user signups. Disables platform interaction.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-destructive/10 pt-4">
                    <span className={`text-sm font-bold ${settings.networkPause ? "text-destructive animate-pulse" : "text-slate-gray"}`}>
                      Status: {settings.networkPause ? "NETWORK PAUSED" : "Operational"}
                    </span>
                    <Button 
                      variant={settings.networkPause ? "outline" : "destructive"} 
                      onClick={() => {
                        startTransition(async () => {
                          await toggleNetworkPause();
                          toast.success(settings.networkPause ? "Network resumed" : "Network paused successfully");
                        });
                      }}
                      disabled={isPending}
                    >
                      {settings.networkPause ? "Resume Network" : "Pause Network"}
                    </Button>
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* --- GLOBAL ANNOUNCEMENT MODAL --- */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 bg-paper-white p-8 premium-shadow">
              <h2 className="headline-md mb-2 text-primary">Draft Broadcast</h2>
              <p className="mb-6 text-sm text-slate-gray">Configure the exact message to display to all visitors.</p>
              
              <form action={async (formData) => {
                await publishAnnouncement(formData);
                setShowAnnouncementModal(false);
                toast.success("Broadcast goes live immediately.");
              }} className="space-y-5">
                <div className="space-y-2">
                  <label className="field-label">Heading</label>
                  <input name="heading" required defaultValue={settings.announcement?.heading} className="form-field w-full text-base" placeholder="Important Update..." />
                </div>
                <div className="space-y-2">
                  <label className="field-label">Paragraph Text</label>
                  <textarea name="paragraph" required defaultValue={settings.announcement?.paragraph} rows={4} className="textarea-field w-full" placeholder="Details of the announcement..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2"><ImageIcon className="size-4"/> Image URL</label>
                    <input name="imageUrl" defaultValue={settings.announcement?.imageUrl} className="ghost-field w-full" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2">Target Link URL</label>
                    <input name="linkUrl" defaultValue={settings.announcement?.linkUrl} className="ghost-field w-full" placeholder="https://..." />
                  </div>
                </div>

                <div className="flex gap-6 py-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" name="isBold" defaultChecked={settings.announcement?.isBold} className="size-4" />
                    Make Text Bold
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold italic">
                    <input type="checkbox" name="isItalic" defaultChecked={settings.announcement?.isItalic} className="size-4" />
                    Make Text Italic
                  </label>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
                  <Button type="submit" variant="secondary" className="bg-vibrant-coral hover:bg-vibrant-coral/90 text-white">Broadcast Live</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="gsap-item flex items-center justify-between">
              <h2 className="headline-md text-primary">Verification Queue</h2>
            </div>
            
            <div className="grid gap-4">
              {allCampaigns.map(campaign => {
                const isExpanded = expandedCampaignId === campaign.id;
                const recipient = campaignRecipient(campaign);
                const paymentMethods = paymentMethodsByProfile[campaign.recipient_id] ?? [];
                const expectedDocTypes = [campaign.category, "citizenship", "tax"];
                const uploadedDocTypes = (campaign.documents || []).map(d => d.document_type);
                const missingDocTypes = expectedDocTypes.filter(type => !uploadedDocTypes.includes(type));
                return (
                  <article key={campaign.id} className="gsap-item border border-surface-container bg-paper-white transition-all hover:border-outline-variant">
                    <button 
                      onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                      className="flex w-full items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-5">
                        <span className={`label-caps w-32 text-center px-3 py-1 ${campaign.status === "active" ? "bg-[#d4edda] text-[#155724]" : campaign.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-[#fff3cd] text-[#856404]"}`}>
                          {statusLabel(campaign)}
                        </span>
                        <div>
                          <h3 className="font-semibold text-primary">{campaign.title}</h3>
                          <p className="text-sm text-slate-gray flex items-center gap-2 mt-1">
                            <UserCheck className="size-4" /> By {recipientName(campaign)} · Created {formatDate(campaign.created_at)}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="size-5 text-slate-gray" /> : <ChevronDown className="size-5 text-slate-gray" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-surface-container bg-surface-container-low p-6 animate-in slide-in-from-top-2">
                        <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
                          <div className="space-y-6">
                            <section className="grid gap-5 lg:grid-cols-[260px_1fr]">
                              <div className="overflow-hidden border border-surface-container bg-paper-white">
                                {campaign.cover_image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={campaign.cover_image_url} alt={campaign.title} className="aspect-[4/3] w-full object-cover" />
                                ) : (
                                  <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-sm text-slate-gray">
                                    No cover image submitted.
                                  </div>
                                )}
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <ReviewField label="Title" value={campaign.title} />
                                <ReviewField label="Category" value={campaign.category} />
                                <ReviewField label="Status" value={statusLabel(campaign)} />
                                <ReviewField label="Verification" value={campaign.verification_status ?? "not set"} />
                                <ReviewField label="Goal amount" value={formatMoney(campaign.goal_amount)} />
                                <ReviewField label="Raised amount" value={formatMoney(campaign.raised_amount)} />
                                <ReviewField label="Location" value={campaign.location} />
                                <ReviewField label="Published" value={formatDate(campaign.published_at)} />
                              </div>
                            </section>

                            <section className="grid gap-4">
                              <ReviewBlock label="Short summary" value={campaign.summary} />
                              <ReviewBlock label="Full story" value={campaign.description} />
                              <ReviewBlock label="Impact statement" value={campaign.impact_statement} />
                            </section>

                            <section className="border border-surface-container bg-paper-white p-5">
                              <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                  <p className="label-caps text-slate-gray">Recipient profile</p>
                                  <h3 className="headline-md mt-2 text-primary">{recipient?.organization_name || recipient?.full_name || "Unnamed recipient"}</h3>
                                </div>
                                <span className="label-caps text-primary">{recipient?.verification_status ?? "unsubmitted"}</span>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <ReviewField label="Full name" value={recipient?.full_name} />
                                <ReviewField label="Organization" value={recipient?.organization_name} />
                                <ReviewField label="Email" value={recipient?.email} />
                                <ReviewField label="Phone" value={recipient?.phone_number} />
                                <ReviewField label="Recipient location" value={recipient?.location} />
                                <ReviewField label="Joined" value={formatDate(recipient?.created_at)} />
                              </div>
                              <ReviewBlock label="Recipient bio" value={recipient?.bio} className="mt-5" />
                            </section>

                            <section className="border border-surface-container bg-paper-white p-5">
                              <div className="mb-5">
                                <p className="label-caps text-slate-gray">Payment methods</p>
                                <h3 className="headline-md mt-2 text-primary">QR and wallet details</h3>
                              </div>
                              {paymentMethods.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                  {paymentMethods.map((method) => (
                                    <article key={`${method.profile_id}-${method.provider}`} className="border border-surface-container p-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <p className="label-caps text-slate-gray">{method.provider}</p>
                                          <h4 className="mt-2 font-semibold text-primary">{method.display_name || method.provider}</h4>
                                          <p className="mt-1 text-sm text-slate-gray">{method.account_reference || "No account reference"}</p>
                                        </div>
                                        <span className={`text-xs font-semibold ${method.is_active ? "text-forest-green" : "text-slate-gray"}`}>
                                          {method.is_active ? "Active" : "Inactive"}
                                        </span>
                                      </div>
                                      {method.qr_image_url ? (
                                        <div className="mt-4 border border-surface-container bg-surface-container-low p-3">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={method.qr_image_url} alt={`${method.provider} QR`} className="h-40 w-full object-contain" />
                                        </div>
                                      ) : null}
                                    </article>
                                  ))}
                                </div>
                              ) : (
                                <p className="border border-dashed border-outline-variant p-5 text-sm text-slate-gray">No payment methods submitted yet.</p>
                              )}
                            </section>

                            <section className="border border-surface-container bg-paper-white p-5">
                              <div className="mb-5 flex justify-between items-start">
                                <div>
                                  <p className="label-caps text-slate-gray">Verification evidence</p>
                                  <h3 className="headline-md mt-2 text-primary">Documents and OCR</h3>
                                </div>
                                {missingDocTypes.length > 0 && (
                                  <div className="bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                                    <span className="font-bold">Missing Docs: </span>
                                    {missingDocTypes.join(", ")}
                                  </div>
                                )}
                              </div>
                              {campaign.documents && campaign.documents.length > 0 ? (
                                <div className="grid gap-4">
                                  {campaign.documents.map((document) => (
                                    <article key={document.id} className="border border-surface-container p-4">
                                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center">
                                        <ReviewField label="File name" value={document.file_name} />
                                        <ReviewField label="Document type" value={document.document_type} />
                                        <ReviewField label="Status" value={document.status} />
                                        {document.ai_confidence_score !== null && document.ai_confidence_score !== undefined ? (
                                          <AIGauge score={Number(document.ai_confidence_score)} />
                                        ) : (
                                          <ReviewField label="AI score" value="N/A" />
                                        )}
                                      </div>
                                      {document.signed_url ? (
                                        <div className="mt-4">
                                          {document.mime_type?.startsWith("image/") ? (
                                            <div className="mb-4 border border-surface-container bg-surface-container-low p-3">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img src={document.signed_url} alt={document.file_name ?? "Uploaded document"} className="max-h-96 w-full object-contain" />
                                            </div>
                                          ) : null}
                                          <a href={document.signed_url} target="_blank" rel="noreferrer" className="label-caps inline-flex text-primary hover:text-vibrant-coral">
                                            Open uploaded file
                                          </a>
                                        </div>
                                      ) : null}
                                      <ReviewBlock label="OCR excerpt" value={document.ocr_excerpt} className="mt-4" />
                                    </article>
                                  ))}
                                </div>
                              ) : (
                                <p className="border border-dashed border-outline-variant p-5 text-sm text-slate-gray">No document evidence recorded for this campaign.</p>
                              )}
                            </section>
                          </div>

                          <div className="w-full space-y-4 shrink-0">
                            <div className="border border-surface-container bg-paper-white p-5">
                              <p className="label-caps text-slate-gray">Review actions</p>
                              <p className="mt-2 text-sm leading-6 text-slate-gray">Approve only after the story, recipient, payment method, and evidence are consistent.</p>
                            </div>
                            <form action={reviewCampaign} className="space-y-3">
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <div className="flex gap-2">
                                <Button type="submit" name="decision" value="approve" variant="secondary" className="flex-1 bg-forest-green hover:bg-forest-green/90">Approve</Button>
                                <Button type="submit" name="decision" value="reject" variant="destructive" className="flex-1">Reject</Button>
                              </div>
                              <Button type="submit" name="decision" value="review" variant="outline" className="w-full">Force Reverify</Button>
                            </form>
                            <form action={startCampaignConversation}>
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <Button type="submit" variant="outline" className="w-full">Message Recipient</Button>
                            </form>
                            <Button 
                              onClick={() => handleSetFeatured(campaign.id)} 
                              variant="outline" 
                              className={`w-full ${settings.featuredCampaignId === campaign.id ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-primary/10"}`}
                            >
                              {settings.featuredCampaignId === campaign.id ? "Currently Featured" : "Set as Featured"}
                            </Button>
                            <form action={deleteCampaign}>
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <Button type="submit" variant="ghost" className="w-full text-destructive hover:bg-destructive/10"><Trash2 className="mr-2 size-4"/> Delete</Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="gsap-item headline-md text-primary">Luxurious User Directory</h2>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {allProfiles.map(profile => (
                <article key={profile.id} className="gsap-item group relative flex flex-col justify-between overflow-hidden border border-surface-container bg-paper-white p-6 premium-shadow transition-all hover:-translate-y-1 hover:shadow-xl">
                  {/* Decorative accent */}
                  <div className={`absolute left-0 top-0 h-1 w-full ${profile.role === 'admin' ? 'bg-vibrant-coral' : profile.role === 'recipient' ? 'bg-primary' : 'bg-surface-container-high'}`} />
                  
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="label-caps font-bold tracking-widest text-primary">{profile.role === 'recipient' ? 'RECEPTION' : profile.role.toUpperCase()}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${profile.verification_status === 'verified' ? 'bg-[#d4edda] text-[#155724]' : 'bg-surface-container-high text-slate-gray'}`}>
                        {profile.verification_status}
                      </span>
                    </div>
                    
                    <h3 className="font-display text-2xl text-primary">{profile.full_name || profile.organization_name || "Exclusive Member"}</h3>
                    <p className="mt-1 text-sm text-slate-gray">{profile.email ?? "No email provided"}</p>
                    <p className="mt-4 text-xs text-slate-gray border-t border-surface-container pt-4">Joined {formatDate(profile.created_at)}</p>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <form action={updateProfileRole} className="flex gap-2">
                      <input type="hidden" name="profileId" value={profile.id} />
                      <select name="role" defaultValue={profile.role} className="ghost-field w-full text-sm font-semibold">
                        <option value="donor">Donor</option>
                        <option value="recipient">Reception (Recipient)</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" variant="secondary" size="sm">Set</Button>
                    </form>
                    <div className="flex gap-2">
                      <form action={reviewProfile} className="flex-1">
                        <input type="hidden" name="profileId" value={profile.id} />
                        <Button type="submit" name="decision" value="approve" variant="outline" className="w-full text-xs">Verify Profile</Button>
                      </form>
                      <form action={deleteProfile}>
                        <input type="hidden" name="profileId" value={profile.id} />
                        <Button type="submit" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></Button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "donations" && (
          <div className="space-y-6">
            <h2 className="gsap-item headline-md text-primary">Global Ledger</h2>

            <div className="gsap-item overflow-hidden border border-surface-container bg-paper-white premium-shadow">
              <div className="grid grid-cols-5 gap-4 border-b border-surface-container bg-surface-container-low p-4 text-sm font-bold text-slate-gray">
                <div>Amount</div>
                <div className="col-span-2">Campaign & Donor</div>
                <div>Method & Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y divide-surface-container">
                {allDonations.map(donation => {
                  const campaignTitle = Array.isArray(donation.campaigns) ? donation.campaigns[0]?.title : donation.campaigns?.title;
                  const displayCampaignTitle = campaignTitle ?? "Unknown Campaign";
                  return (
                    <div key={donation.id} className="grid grid-cols-5 items-center gap-4 p-4 hover:bg-surface-container-low/50">
                      <div className="font-display text-xl font-semibold text-primary">{formatMoney(donation.amount)}</div>
                      <div className="col-span-2">
                        <p className="font-semibold text-primary truncate" title={displayCampaignTitle}>{displayCampaignTitle}</p>
                        <p className="text-sm text-slate-gray">{donation.donor_name || donation.donor_email || "Anonymous"} · {formatDate(donation.created_at)}</p>
                      </div>
                      <div>
                        <p className="label-caps text-slate-gray">{donation.payment_method}</p>
                        <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${donation.status === "successful" ? "bg-[#d4edda] text-[#155724]" : donation.status === "pending" ? "bg-[#fff3cd] text-[#856404]" : "bg-destructive/10 text-destructive"}`}>
                          {donation.status}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <form action={updateDonationStatus} className="flex gap-2">
                          <input type="hidden" name="donationId" value={donation.id} />
                          <select name="status" defaultValue={donation.status} className="ghost-field w-24 text-xs font-semibold">
                            <option value="pending">Pending</option>
                            <option value="successful">Success</option>
                            <option value="failed">Failed</option>
                          </select>
                          <Button type="submit" variant="secondary" size="sm">Save</Button>
                        </form>
                        <form action={deleteDonation}>
                          <input type="hidden" name="donationId" value={donation.id} />
                          <Button type="submit" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
             <div className="gsap-item flex items-center justify-between">
              <h2 className="headline-md text-primary">Financial Reports & Analytics</h2>
              <div className="flex gap-2 rounded bg-surface-container-low p-1 border border-outline-variant">
                {["1D", "1W", "1M", "1Y"].map(range => (
                  <button 
                    key={range}
                    onClick={() => setReportRange(range)}
                    className={`rounded px-4 py-1 text-sm font-semibold transition-colors ${reportRange === range ? "bg-paper-white text-primary premium-shadow" : "text-slate-gray hover:text-primary"}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="gsap-item border border-surface-container bg-paper-white p-8 premium-shadow">
              <div className="mb-6 flex justify-between">
                <div>
                  <p className="label-caps text-slate-gray">Total Revenue ({reportRange})</p>
                  <p className="font-display text-4xl mt-2 text-primary">{formatMoney(stats.totalRaised)}</p>
                </div>
                <div className="text-right">
                  <p className="label-caps text-slate-gray">Growth</p>
                  <p className="font-display text-2xl mt-2 text-forest-green">{allDonations.length} records</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} tickFormatter={(value) => `Rs.${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`NPR ${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="total" stroke="#1A365D" strokeWidth={3} dot={{ r: 4, fill: '#1A365D' }} activeDot={{ r: 6, fill: '#FF6B6B', stroke: 'white', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div className="space-y-6">
            <h2 className="gsap-item headline-md text-primary">Support Desk</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {openTickets.map((ticket) => (
                <article key={ticket.id} className="gsap-item border border-surface-container bg-paper-white p-6 premium-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-caps text-slate-gray">{ticket.category} · Priority: {ticket.priority}</p>
                      <h3 className="headline-md mt-2 text-primary">{ticket.subject}</h3>
                      <p className="mt-1 text-sm text-slate-gray">{ticket.requester_email ?? "No requester email"} · {formatDate(ticket.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded bg-surface-container-low p-4 text-sm leading-6 text-slate-gray border border-outline-variant border-dashed">
                    &ldquo;{ticket.message}&rdquo;
                  </div>

                  <form action={updateSupportTicket} className="mt-6 grid gap-4">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <div className="flex gap-4">
                      <select name="status" defaultValue={ticket.status} className="ghost-field flex-1 h-12 rounded-md px-3 font-semibold">
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <select name="priority" defaultValue={ticket.priority} className="ghost-field flex-1 h-12 rounded-md px-3 font-semibold">
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <textarea
                      name="adminNotes"
                      rows={2}
                      defaultValue={ticket.admin_notes ?? ""}
                      placeholder="Superadmin Reply / Internal Notes..."
                      className="textarea-field p-4 text-sm"
                    />
                    <Button type="submit" variant="secondary" className="w-full h-12">Submit Response</Button>
                  </form>
                </article>
              ))}
              
              {openTickets.length === 0 && (
                <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center border border-dashed border-outline-variant bg-surface-container-low">
                  <LifeBuoy className="mb-4 size-12 text-primary opacity-20" />
                  <h3 className="headline-md text-primary">Inbox Zero</h3>
                  <p className="mt-2 text-slate-gray">No open support tickets at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-surface-container bg-paper-white p-6 premium-shadow">
      <p className="label-caps text-slate-gray">{label}</p>
      <p className="font-display mt-4 text-4xl leading-none text-primary">{value}</p>
      {detail && <p className="mt-4 text-sm text-slate-gray border-t border-surface-container pt-4">{detail}</p>}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="border border-surface-container bg-paper-white p-4">
      <p className="label-caps text-slate-gray">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-primary">{value || "Not provided"}</p>
    </div>
  );
}

function ReviewBlock({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={`border border-surface-container bg-paper-white p-5 ${className}`}>
      <p className="label-caps text-slate-gray">{label}</p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-gray">{value || "Not provided"}</p>
    </div>
  );
}

function isCampaignPending(campaign: Campaign) {
  return campaign.status === "pending_verification" || campaign.verification_status === "in_review" || campaign.verification_status === "pending";
}

function recipientName(campaign: Campaign) {
  const recipient = campaignRecipient(campaign);

  return recipient?.full_name || recipient?.email || "Unknown";
}

function campaignRecipient(campaign: Campaign) {
  return Array.isArray(campaign.recipient) ? campaign.recipient[0] : campaign.recipient;
}

function statusLabel(campaign: Campaign) {
  if (isCampaignPending(campaign)) return "Pending Review";

  return campaign.status.replace("_", " ");
}

function AIGauge({ score }: { score: number }) {
  const isHigh = score >= 90;
  const isMed = score >= 70;
  const color = isHigh ? "text-forest-green" : isMed ? "text-[#856404]" : "text-destructive";
  
  return (
    <div className="flex flex-col items-center justify-center p-4 border border-surface-container">
      <div className={`relative size-20 flex items-center justify-center ${color}`}>
        <svg className="absolute inset-0 size-full -rotate-90">
          <circle cx="40" cy="40" r="36" className="fill-none stroke-surface-container-high stroke-[8]" />
          <circle cx="40" cy="40" r="36" className="fill-none stroke-[8] stroke-current" strokeDasharray={`${(score / 100) * 226.19} 226.19`} strokeLinecap="round" />
        </svg>
        <span className="font-display text-xl">{score}%</span>
      </div>
      <p className="mt-2 text-xs font-bold label-caps text-slate-gray">AI Confidence</p>
    </div>
  );
}
