
-- Create challenge status enum
CREATE TYPE public.challenge_status AS ENUM ('pending', 'accepted', 'active', 'completed', 'declined', 'cancelled');
CREATE TYPE public.challenge_scope AS ENUM ('world', 'country', 'state');

-- Challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scope challenge_scope NOT NULL DEFAULT 'world',
  status challenge_status NOT NULL DEFAULT 'pending',
  deadline TIMESTAMP WITH TIME ZONE,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by authenticated users"
ON public.challenges FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create challenges as challenger"
ON public.challenges FOR INSERT TO authenticated
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update their challenges"
ON public.challenges FOR UPDATE TO authenticated
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Challenge messages table
CREATE TABLE public.challenge_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view challenge messages"
ON public.challenge_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id
    AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
  )
);

CREATE POLICY "Participants can send challenge messages"
ON public.challenge_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id
    AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
  )
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_messages;

-- Challenge videos table
CREATE TABLE public.challenge_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge videos viewable by authenticated"
ON public.challenge_videos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Participants can upload challenge videos"
ON public.challenge_videos FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id
    AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
  )
);

-- Storage bucket for challenge videos
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-videos', 'challenge-videos', true);

CREATE POLICY "Anyone can view challenge videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-videos');

CREATE POLICY "Authenticated users can upload challenge videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own challenge videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'challenge-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
