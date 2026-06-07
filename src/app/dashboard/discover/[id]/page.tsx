import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, MapPin, MessageSquareText } from "lucide-react";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DonationPanel } from "@/app/campaigns/[id]/donation-panel";
import { startCampaignConversation } from "@/app/dashboard/actions";
import { getAuthenticatedProfile } from "@/lib/auth";
import { formatDate, formatMoney, progressPercent } from "@/lib/format";

type Campaign = {
  id: string;
  recipient_id: string;
  title: string;
  summary: string | null;
  description: string;
  category: string;
  goal_amount: number;
  raised_amount: number;
  cover_image_url: string | null;
  location: string | null;
  impact_statement: string | null;
  verification_status: string;
  published_at: string | null;
  recipient?: {
    full_name: string | null;
    email: string | null;
    phone_number: string | null;
    organization_name: string | null;
    location: string | null;
    bio: string | null;
    verification_status: string | null;
  } | {
    full_name: string | null;
    email: string | null;
    phone_number: string | null;
    organization_name: string | null;
    location: string | null;
    bio: string | null;
    verification_status: string | null;
  }[] | null;
  documents?: DocumentRow[];
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

type PaymentMethod = {
  id: string;
  provider: string;
  display_name: string | null;
  qr_image_url: string | null;
  account_reference: string | null;
};

export const dynamic = "force-dynamic";

export default async function DashboardCampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedProfile();

  const { data } = await supabase
    .from("campaigns")
    .select("id,recipient_id,title,summary,description,category,goal_amount,raised_amount,cover_image_url,location,impact_statement,verification_status,published_at,recipient:profiles!campaigns_recipient_id_fkey(full_name,email,phone_number,organization_name,location,bio,verification_status)")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSupabase = serviceRoleKey 
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : supabase;

  const { data: rawDocuments } = await adminSupabase
    .from("documents")
    .select("id,file_name,file_url,mime_type,document_type,ocr_excerpt,ai_confidence_score,status,created_at")
    .eq("campaign_id", id);

  const campaign = {
    ...(data as unknown as Campaign),
    documents: await Promise.all(
      (rawDocuments ?? []).map(async (document) => {
        if (!document.file_url) return { ...document, signed_url: null };
        if (/^https?:\/\//i.test(document.file_url)) return { ...document, signed_url: document.file_url };

        const { data: signed } = await adminSupabase.storage.from("campaign-documents").createSignedUrl(document.file_url, 60 * 60);
        return { ...document, signed_url: signed?.signedUrl ?? null };
      })
    ),
  } satisfies Campaign;

  const recipient = Array.isArray(campaign.recipient) ? campaign.recipient[0] : campaign.recipient;
  const { data: paymentMethods } = await supabase
    .from("recipient_payment_methods")
    .select("id,provider,display_name,qr_image_url,account_reference")
    .eq("profile_id", campaign.recipient_id)
    .eq("is_active", true)
    .order("provider", { ascending: true });

  const percent = progressPercent(campaign.raised_amount, campaign.goal_amount);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link href="/dashboard/discover" className="label-caps inline-flex items-center gap-2 text-slate-gray hover:text-primary">
        <ArrowLeft className="size-4" />
        Active campaigns
      </Link>

      <section className="grid gap-10 xl:grid-cols-[1fr_420px]">
        <article className="space-y-8">
          <div className="overflow-hidden border border-surface-container bg-paper-white">
            {campaign.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.cover_image_url} alt={campaign.title} className="max-h-[520px] w-full object-cover" />
            ) : (
              <div className="flex min-h-96 items-center justify-center p-10 text-center text-slate-gray">No campaign image submitted.</div>
            )}
          </div>

          <div>
            <p className="label-caps mb-4 text-slate-gray">{campaign.category}</p>
            <h1 className="headline-xl text-primary">{campaign.title}</h1>
            <div className="my-6 flex flex-wrap items-center gap-5 border-y border-surface-container py-5 text-sm text-slate-gray">
              {campaign.location ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4" />
                  {campaign.location}
                </span>
              ) : null}
              <span>Published {formatDate(campaign.published_at)}</span>
              <span className="inline-flex items-center gap-2 text-forest-green">
                <CheckCircle2 className="size-4" />
                {campaign.verification_status}
              </span>
            </div>
            {campaign.summary ? <p className="text-xl leading-8 text-slate-gray">{campaign.summary}</p> : null}
          </div>

          <ReviewSection title="Full story" body={campaign.description} />
          <ReviewSection title="Impact statement" body={campaign.impact_statement} />

          <section className="form-panel">
            <p className="label-caps text-slate-gray">Recipient details</p>
            <h2 className="headline-md mt-2 text-primary">{recipient?.organization_name || recipient?.full_name || "Recipient"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Name" value={recipient?.full_name} />
              <Info label="Organization" value={recipient?.organization_name} />
              <Info label="Email" value={recipient?.email} />
              <Info label="Phone" value={recipient?.phone_number} />
              <Info label="Location" value={recipient?.location} />
              <Info label="Verification" value={recipient?.verification_status} />
            </div>
            {recipient?.bio ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-gray">{recipient.bio}</p> : null}
          </section>

          <section className="form-panel">
            <div className="form-section-heading">
              <div>
                <p className="label-caps text-slate-gray">Evidence</p>
                <h2 className="headline-md mt-2 text-primary">Uploaded documents</h2>
              </div>
              <FileText className="size-6 text-primary" />
            </div>

            {campaign.documents && campaign.documents.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {campaign.documents.map((document) => (
                  <article key={document.id} className="border border-surface-container p-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="File" value={document.file_name} />
                      <Info label="Type" value={document.document_type} />
                      <Info label="Status" value={document.status} />
                      <Info label="AI score" value={document.ai_confidence_score === null || document.ai_confidence_score === undefined ? "N/A" : `${document.ai_confidence_score}%`} />
                    </div>
                    {document.signed_url ? (
                      <div className="mt-5">
                        {document.mime_type?.startsWith("image/") ? (
                          <div className="mb-4 border border-surface-container bg-surface-container-low p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={document.signed_url} alt={document.file_name ?? "Uploaded document"} className="max-h-96 w-full object-contain" />
                          </div>
                        ) : null}
                        <a href={document.signed_url} target="_blank" rel="noreferrer" className="label-caps text-primary hover:text-vibrant-coral">
                          Open uploaded file
                        </a>
                      </div>
                    ) : null}
                    {document.ocr_excerpt ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-gray">{document.ocr_excerpt}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 border border-dashed border-outline-variant p-6 text-sm text-slate-gray">No evidence files are visible for this campaign.</p>
            )}
          </section>
        </article>

        <aside className="space-y-6">
          <section className="form-panel">
            <p className="label-caps mb-2 text-slate-gray">Funding status</p>
            <p className="font-display text-5xl leading-none text-primary">{formatMoney(campaign.raised_amount)}</p>
            <p className="mt-2 text-sm text-slate-gray">raised of {formatMoney(campaign.goal_amount)} goal</p>
            <div className="mt-6 h-1 bg-surface-container-high">
              <div className="h-full bg-forest-green" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 label-caps text-primary">{percent}% funded</p>
          </section>

          {user.id !== campaign.recipient_id ? (
            <form action={startCampaignConversation} className="form-panel">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <h2 className="headline-md text-primary">Questions?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-gray">Start a private campaign chat with the recipient.</p>
              <Button type="submit" variant="outline" className="mt-5 w-full">
                <MessageSquareText className="mr-2 size-4" />
                Message recipient
              </Button>
            </form>
          ) : null}

          {campaign.raised_amount >= campaign.goal_amount ? (
            <div className="form-panel border-forest-green bg-[#b1f0ce]/20">
              <h2 className="headline-md text-forest-green">Goal Reached!</h2>
              <p className="mt-2 text-sm leading-6 text-slate-gray">
                Donors shouldn't send more money here. Contact via phone number: {recipient?.phone_number || "Not provided"} with proper reason to help further.
              </p>
            </div>
          ) : (
            <DonationPanel campaignId={campaign.id} paymentMethods={(paymentMethods ?? []) as PaymentMethod[]} />
          )}
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="border border-surface-container bg-paper-white p-4">
      <p className="label-caps text-slate-gray">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-primary">{value || "Not provided"}</p>
    </div>
  );
}

function ReviewSection({ title, body }: { title: string; body: string | null | undefined }) {
  return (
    <section className="form-panel">
      <h2 className="headline-md text-primary">{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-gray">{body || "Not provided"}</p>
    </section>
  );
}
