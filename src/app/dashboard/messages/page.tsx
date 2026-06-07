import Link from "next/link";
import { MessageSquareText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendMessage } from "@/app/dashboard/actions";
import { getAuthenticatedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ChatClient } from "./chat-client";

type Participant = {
  profile_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
};

type Conversation = {
  id: string;
  campaign_id: string | null;
  updated_at: string | null;
  campaigns?: { title: string | null } | { title: string | null }[] | null;
  conversation_participants?: Participant[];
};

type Message = {
  id: string;
  body: string;
  created_at: string | null;
  sender_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
};

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation } = await searchParams;
  const { supabase, user } = await getAuthenticatedProfile();

  const { data: conversationRows } = await supabase
    .from("conversations")
    .select("id,campaign_id,updated_at,campaigns(title),conversation_participants(profile_id,profiles(full_name,email,role))")
    .order("updated_at", { ascending: false })
    .limit(50);

  const conversations = (conversationRows ?? []) as unknown as Conversation[];
  const selectedConversation = conversations.find((item) => item.id === conversation) ?? conversations[0];

  const { data: messageRows } = selectedConversation
    ? await supabase
        .from("messages")
        .select("id,body,created_at,sender_id,profiles(full_name,email,role)")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const messages = (messageRows ?? []) as unknown as Message[];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="label-caps mb-3 text-slate-gray">MESSAGES</p>
        <h1 className="headline-xl text-primary">Actor Chat</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">
          Talk with donors, recipients, and administrators around campaign-specific questions.
        </p>
      </div>

      <section className="grid min-h-[620px] gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="form-panel p-0">
          <div className="border-b border-surface-container p-5">
            <h2 className="headline-md text-primary">Threads</h2>
          </div>

          {conversations.length > 0 ? (
            <div className="divide-y divide-surface-container">
              {conversations.map((item) => {
                const active = selectedConversation?.id === item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/messages?conversation=${item.id}`}
                    className={`block p-5 hover:bg-surface-container-low ${active ? "bg-surface-container-low" : ""}`}
                  >
                    <p className="font-semibold text-primary">{campaignTitle(item.campaigns)}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-gray">{participantNames(item, user.id)}</p>
                    <p className="mt-3 label-caps text-slate-gray">{formatDate(item.updated_at)}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquareText className="mx-auto mb-4 size-10 text-slate-gray" />
              <h3 className="font-semibold text-primary">No conversations</h3>
              <p className="mt-2 text-sm leading-6 text-slate-gray">Open a campaign and start a chat with the recipient.</p>
            </div>
          )}
        </aside>

        <main className="form-panel flex min-h-[620px] flex-col p-0">
          <ChatClient
            initialMessages={messages}
            selectedConversation={selectedConversation}
            userId={user.id}
            campaignTitleStr={campaignTitle(selectedConversation?.campaigns)}
            participantNamesStr={selectedConversation ? participantNames(selectedConversation, user.id) : ""}
          />
        </main>
      </section>
    </div>
  );
}

function campaignTitle(campaign: Conversation["campaigns"]) {
  if (Array.isArray(campaign)) {
    return campaign[0]?.title ?? "General conversation";
  }

  return campaign?.title ?? "General conversation";
}

function participantNames(conversation: Conversation, currentUserId: string) {
  const names = (conversation.conversation_participants ?? [])
    .filter((participant) => participant.profile_id !== currentUserId)
    .map((participant) => participant.profiles?.full_name || participant.profiles?.email || "User");

  return names.length > 0 ? names.join(", ") : "Only you";
}
