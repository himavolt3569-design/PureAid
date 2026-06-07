CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_conversation_participant(check_conversation_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = check_conversation_id
      AND profile_id = check_user_id
  );
$$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants read participant rows" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation creators add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants create messages" ON public.messages;

CREATE POLICY "Participants read conversations"
ON public.conversations FOR SELECT
USING (
  public.is_conversation_participant(id, auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Authenticated users create conversations"
ON public.conversations FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Participants update conversations"
ON public.conversations FOR UPDATE
USING (
  public.is_conversation_participant(id, auth.uid())
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_conversation_participant(id, auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Participants read participant rows"
ON public.conversation_participants FOR SELECT
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Conversation creators add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Participants read messages"
ON public.messages FOR SELECT
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Participants create messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_conversation_participant(conversation_id, auth.uid())
    OR public.is_admin(auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS conversations_campaign_idx ON public.conversations (campaign_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS conversation_participants_profile_idx ON public.conversation_participants (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at);
