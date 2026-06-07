import { HelpCircle, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupportTicket } from "@/app/dashboard/actions";
import { getAuthenticatedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";

type TicketRow = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { supabase } = await getAuthenticatedProfile();
  const { data } = await supabase
    .from("support_tickets")
    .select("id,subject,category,message,status,priority,admin_notes,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const tickets = (data ?? []) as TicketRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="label-caps mb-3 text-slate-gray">HELP & SUPPORT</p>
        <h1 className="headline-xl text-primary">Support Center</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">
          Ask for help with verification, campaign publishing, payment QR setup, donation records, or account access.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="form-panel lg:col-span-7">
          <div className="form-section-heading">
            <div>
              <h2 className="headline-md text-primary">Create Support Ticket</h2>
              <p className="mt-1 text-sm text-slate-gray">Share the exact issue so the admin team can respond with context.</p>
            </div>
            <LifeBuoy className="size-6 text-primary" />
          </div>

          <form action={createSupportTicket} className="grid gap-7">
            <label className="flex flex-col gap-2">
              <span className="field-label">Subject</span>
              <input name="subject" required placeholder="Short issue title" className="ghost-field h-14 rounded-md px-4 text-base" />
            </label>

            <label className="flex flex-col gap-2">
              <span className="field-label">Category</span>
              <select name="category" defaultValue="verification" className="ghost-field h-14 rounded-md px-4 text-base">
                <option value="verification">Verification</option>
                <option value="campaign">Campaign</option>
                <option value="payment">Payment QR / Donations</option>
                <option value="account">Account Access</option>
                <option value="technical">Technical Issue</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="field-label">Message</span>
              <textarea
                name="message"
                required
                rows={8}
                placeholder="Describe what happened, what you expected, and any campaign or transaction reference."
                className="textarea-field p-4 text-base rounded-md"
              />
              <span className="field-help">Do not include passwords. For payments, include transaction references only.</span>
            </label>

            <Button type="submit" variant="secondary" className="w-full sm:w-fit">
              Submit Ticket
            </Button>
          </form>
        </section>

        <aside className="space-y-8 lg:col-span-5">
          <section className="form-panel">
            <div className="form-section-heading">
              <div>
                <h2 className="headline-md text-primary">Help Topics</h2>
                <p className="mt-1 text-sm leading-6 text-slate-gray">Common areas the admin team can review.</p>
              </div>
              <HelpCircle className="size-6 text-primary" />
            </div>

            <div className="mt-6 space-y-4">
              <HelpTopic icon={ShieldCheck} title="Verification" body="Campaign review, recipient identity, and document status." />
              <HelpTopic icon={MessageSquareText} title="Campaigns" body="Publishing, rejected submissions, story edits, and evidence notes." />
              <HelpTopic icon={Mail} title="Payments" body="QR uploads, wallet references, donation records, and failed transfers." />
            </div>
          </section>

          <section className="form-panel">
            <h2 className="headline-md text-primary">Your Tickets</h2>
            <div className="mt-6 space-y-4">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <article key={ticket.id} className="border border-surface-container p-4">
                    <p className="label-caps text-slate-gray">{ticket.category} · {ticket.priority} · {ticket.status}</p>
                    <h3 className="mt-2 font-semibold text-primary">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-slate-gray">{formatDate(ticket.created_at)}</p>
                    {ticket.admin_notes ? (
                      <p className="mt-3 border-l-2 border-forest-green pl-3 text-sm leading-6 text-slate-gray">{ticket.admin_notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="border border-dashed border-outline-variant p-6 text-center">
                  <h3 className="font-semibold text-primary">No tickets yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-gray">Submitted support requests will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HelpTopic({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof HelpCircle;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 border border-surface-container p-4">
      <Icon className="mt-1 size-5 text-primary" />
      <div>
        <h3 className="font-semibold text-primary">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-gray">{body}</p>
      </div>
    </div>
  );
}
