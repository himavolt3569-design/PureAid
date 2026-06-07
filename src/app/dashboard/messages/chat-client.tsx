"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
// I will need sendMessage from actions but it's passed or imported
import { sendMessage } from "@/app/dashboard/actions";

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

export function ChatClient({
  initialMessages,
  selectedConversation,
  userId,
  campaignTitleStr,
  participantNamesStr,
}: {
  initialMessages: Message[];
  selectedConversation: Conversation | null;
  userId: string;
  campaignTitleStr: string;
  participantNamesStr: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // We need to fetch the profile info since realtime only sends the message row
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name,email,role")
            .eq("id", newMessage.sender_id)
            .single();

          if (profileData) {
            newMessage.profiles = profileData;
          }

          setMessages((prev) => {
            // Check if we already have this message (optimistic UI or duplicated event)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, supabase]);

  // Scroll to bottom on initial load or new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <MessageSquareText className="mx-auto mb-4 size-12 text-slate-gray" />
          <h2 className="headline-md text-primary">No thread selected</h2>
          <p className="mt-2 text-slate-gray">Campaign chats will appear here after a conversation starts.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-surface-container p-6">
        <p className="label-caps text-slate-gray">Campaign conversation</p>
        <h2 className="headline-md mt-2 text-primary">{campaignTitleStr}</h2>
        <p className="mt-1 text-sm text-slate-gray">{participantNamesStr}</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length > 0 ? (
          messages.map((message) => {
            const own = message.sender_id === userId;
            return (
              <article key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] border p-4 ${own ? "border-primary bg-primary text-paper-white" : "border-surface-container bg-surface-container-low text-primary"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${own ? "text-paper-white/80" : "text-slate-gray"}`}>
                    {message.profiles?.full_name || message.profiles?.email || "User"} · {message.profiles?.role ?? "actor"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p className={`mt-3 text-xs ${own ? "text-paper-white/70" : "text-slate-gray"}`}>{formatDate(message.created_at)}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex min-h-80 items-center justify-center border border-dashed border-outline-variant text-center">
            <div>
              <MessageSquareText className="mx-auto mb-4 size-10 text-slate-gray" />
              <h3 className="font-semibold text-primary">No messages yet</h3>
              <p className="mt-2 text-sm text-slate-gray">Start the conversation with a clear question or update.</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        id="chat-form"
        className="border-t border-surface-container p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const body = formData.get("body") as string;
          if (!body?.trim() || !selectedConversation) return;

          const messageId = crypto.randomUUID();
          formData.set("id", messageId);
          formData.set("conversationId", selectedConversation.id);

          // Optimistic UI update instantly
          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              body: body.trim(),
              created_at: new Date().toISOString(),
              sender_id: userId,
              profiles: { full_name: "You", email: "", role: "" },
            },
          ]);

          form.reset();
          
          // Send background request without blocking UI
          sendMessage(formData).catch(console.error);
        }}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Write a message... (Press Enter to send, Shift+Enter for new line)"
            className="textarea-field p-4 text-base resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                );
              }
            }}
          />
          <Button type="submit" variant="secondary" className="h-full min-h-16">
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </div>
      </form>
    </>
  );
}
