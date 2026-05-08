
CREATE TABLE public.google_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_token TEXT,
  provider_refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own google integration"
  ON public.google_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own google integration"
  ON public.google_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own google integration"
  ON public.google_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own google integration"
  ON public.google_integrations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER google_integrations_updated_at
  BEFORE UPDATE ON public.google_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.calendar_events
  ADD COLUMN google_event_id TEXT,
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX calendar_events_user_google_event_uniq
  ON public.calendar_events(user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;
