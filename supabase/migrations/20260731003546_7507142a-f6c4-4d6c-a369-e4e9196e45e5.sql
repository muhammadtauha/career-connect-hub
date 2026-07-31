-- ENUMS
CREATE TYPE public.app_role AS ENUM ('student','company','university','qa','admin');
CREATE TYPE public.project_status AS ENUM ('draft','open','paused','closed','completed');
CREATE TYPE public.application_status AS ENUM ('pending','shortlisted','accepted','rejected','withdrawn');
CREATE TYPE public.engagement_status AS ENUM ('active','completed','cancelled');
CREATE TYPE public.milestone_status AS ENUM ('locked','active','submitted','changes_requested','approved');

-- UPDATED AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  university TEXT,
  degree TEXT,
  graduation_year INT,
  location TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  cv_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.app_role;
  EXCEPTION WHEN others THEN _role := 'student';
  END;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  description TEXT,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX companies_owner_idx ON public.companies(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_insert_own" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_delete_own" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  skills TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  duration_weeks INT NOT NULL DEFAULT 12,
  openings INT NOT NULL DEFAULT 1,
  is_remote BOOLEAN NOT NULL DEFAULT true,
  deadline DATE,
  status public.project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_company_idx ON public.projects(company_id);
CREATE INDEX projects_status_idx ON public.projects(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_company(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_project(_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _project_id AND c.owner_id = auth.uid()
  );
$$;

CREATE POLICY "projects_select_public" ON public.projects FOR SELECT TO authenticated
  USING (status <> 'draft' OR public.owns_company(company_id));
CREATE POLICY "projects_insert_owner" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "projects_update_owner" ON public.projects FOR UPDATE TO authenticated USING (public.owns_company(company_id)) WITH CHECK (public.owns_company(company_id));
CREATE POLICY "projects_delete_owner" ON public.projects FOR DELETE TO authenticated USING (public.owns_company(company_id));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL DEFAULT '',
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_id)
);
CREATE INDEX applications_project_idx ON public.applications(project_id);
CREATE INDEX applications_student_idx ON public.applications(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.owns_project(project_id));
CREATE POLICY "applications_insert_student" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = student_id OR public.owns_project(project_id))
  WITH CHECK (auth.uid() = student_id OR public.owns_project(project_id));
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ENGAGEMENTS
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.engagement_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_id)
);
CREATE INDEX engagements_student_idx ON public.engagements(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagements TO authenticated;
GRANT ALL ON public.engagements TO service_role;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engagements_select" ON public.engagements FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.owns_project(project_id));
CREATE POLICY "engagements_insert_owner" ON public.engagements FOR INSERT TO authenticated WITH CHECK (public.owns_project(project_id));
CREATE POLICY "engagements_update" ON public.engagements FOR UPDATE TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));
CREATE TRIGGER engagements_updated_at BEFORE UPDATE ON public.engagements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MILESTONES
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  due_date DATE,
  status public.milestone_status NOT NULL DEFAULT 'locked',
  submission_url TEXT,
  submission_note TEXT,
  submitted_at TIMESTAMPTZ,
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX milestones_engagement_idx ON public.milestones(engagement_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_engagement(_engagement_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.projects p ON p.id = e.project_id
    JOIN public.companies c ON c.id = p.company_id
    WHERE e.id = _engagement_id AND (e.student_id = auth.uid() OR c.owner_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_engagement_company(_engagement_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.projects p ON p.id = e.project_id
    JOIN public.companies c ON c.id = p.company_id
    WHERE e.id = _engagement_id AND c.owner_id = auth.uid()
  );
$$;

CREATE POLICY "milestones_select" ON public.milestones FOR SELECT TO authenticated USING (public.can_view_engagement(engagement_id));
CREATE POLICY "milestones_insert_company" ON public.milestones FOR INSERT TO authenticated WITH CHECK (public.owns_engagement_company(engagement_id));
CREATE POLICY "milestones_update" ON public.milestones FOR UPDATE TO authenticated
  USING (public.can_view_engagement(engagement_id)) WITH CHECK (public.can_view_engagement(engagement_id));
CREATE POLICY "milestones_delete_company" ON public.milestones FOR DELETE TO authenticated USING (public.owns_engagement_company(engagement_id));
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);