-- Users & Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  coins integer DEFAULT 0,
  earned_coins integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  region text DEFAULT 'GLOBAL',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  video_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Post Likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Followers
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  read_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Live Streams
CREATE TABLE public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  started_at timestamp DEFAULT now(),
  ended_at timestamp,
  viewer_count integer DEFAULT 0
);

-- Live Chat Messages
CREATE TABLE public.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  kind text DEFAULT 'message',
  gift_key text,
  created_at timestamp DEFAULT now()
);

-- Stream Viewers
CREATE TABLE public.stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp DEFAULT now(),
  UNIQUE(stream_id, user_id)
);

-- Coin Purchases
CREATE TABLE public.coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins integer NOT NULL,
  usd_cents integer NOT NULL,
  status text DEFAULT 'succeeded',
  stripe_transaction_id text UNIQUE,
  created_at timestamp DEFAULT now()
);

-- Payout Requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_amount integer NOT NULL,
  usd_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  payout_method text NOT NULL,
  status text DEFAULT 'pending',
  hold_until timestamp,
  created_at timestamp DEFAULT now(),
  processed_at timestamp
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_followers_follower ON public.followers(follower_id);
CREATE INDEX idx_followers_following ON public.followers(following_id);
CREATE INDEX idx_live_streams_host ON public.live_streams(host_id);
CREATE INDEX idx_live_chat_stream ON public.live_chat_messages(stream_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Posts are public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
