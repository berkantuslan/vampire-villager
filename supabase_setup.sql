-- 1. Enable Realtime (Safe to run multiple times)
-- No action needed here, we add tables at the end.

-- 2. Tables (Create only if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rooms (
    code TEXT PRIMARY KEY,
    creator_id UUID,
    status TEXT DEFAULT 'waiting' NOT NULL,
    current_phase TEXT DEFAULT 'lobby' NOT NULL,
    phase_number INTEGER DEFAULT 1 NOT NULL,
    vampire_target UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    is_ready BOOLEAN DEFAULT false,
    role TEXT,
    is_alive BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
    player_id UUID,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.signaling (
    id BIGSERIAL PRIMARY KEY,
    room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.votes (
    id BIGSERIAL PRIMARY KEY,
    room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
    voter_id UUID NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS (Row Level Security) - Enable
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Drop and Recreate to be safe and ensure access)
-- This allows access to EVERYONE (Guests + Users) for testing purposes.

DROP POLICY IF EXISTS "Allow all" ON public.user_profiles;
CREATE POLICY "Allow all" ON public.user_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON public.rooms;
CREATE POLICY "Allow all" ON public.rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON public.players;
CREATE POLICY "Allow all" ON public.players FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON public.messages;
CREATE POLICY "Allow all" ON public.messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON public.signaling;
CREATE POLICY "Allow all" ON public.signaling FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON public.votes;
CREATE POLICY "Allow all" ON public.votes FOR ALL USING (true);

-- 5. Realtime Publication (Safe add)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
