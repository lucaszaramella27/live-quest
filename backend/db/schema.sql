-- LiveQuest PostgreSQL schema
-- Execute with psql against your PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  photo_url text,
  is_premium boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
  achievements text[] NOT NULL DEFAULT '{}',
  unlocked_titles text[] NOT NULL DEFAULT '{novice}',
  active_title text,
  weekly_xp integer NOT NULL DEFAULT 0 CHECK (weekly_xp >= 0),
  monthly_xp integer NOT NULL DEFAULT 0 CHECK (monthly_xp >= 0),
  user_name text NOT NULL DEFAULT 'Usuario',
  user_photo_url text NOT NULL DEFAULT '',
  is_premium boolean NOT NULL DEFAULT false,
  premium_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  rewarded_at timestamptz,
  time text NOT NULL DEFAULT '',
  date text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  day text NOT NULL,
  time text NOT NULL,
  game text NOT NULL,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_checkin timestamptz
);

CREATE TABLE IF NOT EXISTS public.daily_activity (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  tasks_completed integer NOT NULL DEFAULT 0,
  goals_completed integer NOT NULL DEFAULT 0,
  events_created integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.reward_daily (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  task_count integer NOT NULL DEFAULT 0,
  goal_count integer NOT NULL DEFAULT 0,
  event_count integer NOT NULL DEFAULT 0,
  xp_total integer NOT NULL DEFAULT 0,
  coins_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_inventories (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  purchased_item_ids text[] NOT NULL DEFAULT '{}',
  active_powerups jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.shop_stock (
  item_id text PRIMARY KEY,
  stock integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_key text NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.twitch_integrations (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  twitch_user_id text,
  twitch_login text,
  twitch_display_name text,
  twitch_profile_image text,
  broadcaster_type text,
  connected_at timestamptz,
  last_stream_check timestamptz,
  is_live boolean NOT NULL DEFAULT false,
  total_followers integer NOT NULL DEFAULT 0,
  total_subscribers integer NOT NULL DEFAULT 0,
  total_views integer NOT NULL DEFAULT 0,
  auto_xp_on_live boolean NOT NULL DEFAULT true,
  xp_per_hour_live integer NOT NULL DEFAULT 50,
  auto_goals_from_twitch boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.twitch_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  target_value integer NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  xp_reward integer NOT NULL DEFAULT 0,
  coins_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_goals_user_created ON public.goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_user_date ON public.checklists(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_weekly ON public.user_progress(weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_monthly ON public.user_progress(monthly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_alltime ON public.user_progress(xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_source ON public.xp_ledger(user_id, source_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_daily_user_date ON public.reward_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_twitch_goals_user_created ON public.twitch_goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_week ON public.user_challenges(user_id, week_key);

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_progress_set_updated_at ON public.user_progress;
CREATE TRIGGER user_progress_set_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS daily_activity_set_updated_at ON public.daily_activity;
CREATE TRIGGER daily_activity_set_updated_at
BEFORE UPDATE ON public.daily_activity
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS reward_daily_set_updated_at ON public.reward_daily;
CREATE TRIGGER reward_daily_set_updated_at
BEFORE UPDATE ON public.reward_daily
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_inventories_set_updated_at ON public.user_inventories;
CREATE TRIGGER user_inventories_set_updated_at
BEFORE UPDATE ON public.user_inventories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_challenges_set_updated_at ON public.user_challenges;
CREATE TRIGGER user_challenges_set_updated_at
BEFORE UPDATE ON public.user_challenges
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS twitch_integrations_set_updated_at ON public.twitch_integrations;
CREATE TRIGGER twitch_integrations_set_updated_at
BEFORE UPDATE ON public.twitch_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
