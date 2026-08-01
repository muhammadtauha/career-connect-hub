
-- ============ PROFILE EXPANSION ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS soft_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS portfolio jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- ============ COMPANY EXPANSION ============
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS hiring boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, reviewer_id)
);

GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select_all ON public.reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY reviews_insert_participant ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND public.can_view_engagement(engagement_id));
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ADMIN ACCESS ============
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY companies_admin_update ON public.companies
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY companies_admin_delete ON public.companies
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY projects_admin_select ON public.projects
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY projects_admin_update ON public.projects
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY projects_admin_delete ON public.projects
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY applications_admin_select ON public.applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY engagements_admin_select ON public.engagements
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ NOTIFICATION HELPERS & TRIGGERS ============
CREATE OR REPLACE FUNCTION public.notify(_user_id uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT _user_id, _type, _title, COALESCE(_body, ''), _link
  WHERE _user_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.project_owner(_project_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.owner_id FROM public.projects p JOIN public.companies c ON c.id = p.company_id
  WHERE p.id = _project_id;
$$;

CREATE OR REPLACE FUNCTION public.on_application_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text; _owner uuid; _student text;
BEGIN
  SELECT p.title INTO _title FROM public.projects p WHERE p.id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    _owner := public.project_owner(NEW.project_id);
    SELECT full_name INTO _student FROM public.profiles WHERE id = NEW.student_id;
    PERFORM public.notify(_owner, 'application_new', 'New application',
      COALESCE(NULLIF(_student, ''), 'A student') || ' applied to ' || COALESCE(_title, 'your project'),
      '/company/projects/' || NEW.project_id::text);
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('shortlisted','accepted','rejected') THEN
    PERFORM public.notify(NEW.student_id, 'application_' || NEW.status::text,
      'Application ' || NEW.status::text,
      'Your application for ' || COALESCE(_title, 'a project') || ' was ' || NEW.status::text || '.',
      '/applications');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER applications_notify
AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.on_application_change();

CREATE OR REPLACE FUNCTION public.on_milestone_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _student uuid; _owner uuid; _project uuid;
BEGIN
  SELECT e.student_id, e.project_id INTO _student, _project
  FROM public.engagements e WHERE e.id = NEW.engagement_id;
  _owner := public.project_owner(_project);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(_student, 'milestone_assigned', 'New milestone assigned',
      NEW.title, '/workspace/' || NEW.engagement_id::text);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'submitted' THEN
      PERFORM public.notify(_owner, 'milestone_submitted', 'Milestone submitted',
        NEW.title || ' is ready for review.', '/workspace/' || NEW.engagement_id::text);
    ELSIF NEW.status = 'approved' THEN
      PERFORM public.notify(_student, 'milestone_approved', 'Milestone approved',
        NEW.title || ' was approved.', '/workspace/' || NEW.engagement_id::text);
    ELSIF NEW.status = 'changes_requested' THEN
      PERFORM public.notify(_student, 'milestone_changes', 'Changes requested',
        COALESCE(NULLIF(NEW.feedback, ''), NEW.title || ' needs changes.'),
        '/workspace/' || NEW.engagement_id::text);
    END IF;
  ELSIF NEW.feedback IS DISTINCT FROM OLD.feedback AND COALESCE(NEW.feedback,'') <> '' THEN
    PERFORM public.notify(_student, 'feedback_new', 'New feedback received',
      NEW.feedback, '/workspace/' || NEW.engagement_id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER milestones_notify
AFTER INSERT OR UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.on_milestone_change();

CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _target uuid;
BEGIN
  IF NEW.subject_user_id IS NOT NULL THEN
    _target := NEW.subject_user_id;
  ELSE
    SELECT owner_id INTO _target FROM public.companies WHERE id = NEW.subject_company_id;
  END IF;
  PERFORM public.notify(_target, 'review_new', 'New review received',
    NEW.rating::text || '/5 — ' || COALESCE(NULLIF(NEW.comment, ''), 'No comment'), '/profile');
  RETURN NEW;
END; $$;

CREATE TRIGGER reviews_notify
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.on_review_created();
