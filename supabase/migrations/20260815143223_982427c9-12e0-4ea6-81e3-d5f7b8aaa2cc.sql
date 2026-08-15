CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _role public.app_role; _name text; _company text;
BEGIN
  BEGIN
    _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student')::public.app_role;
  EXCEPTION WHEN others THEN _role := 'student';
  END;

  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'company' THEN
    -- Company accounts get ONLY a company record. No student profile.
    _company := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name',''), NULLIF(_name,''), 'My company');
    INSERT INTO public.companies (owner_id, name)
    SELECT NEW.id, _company
    WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = NEW.id);
  ELSE
    -- Non-company accounts get ONLY a person profile. No company record.
    INSERT INTO public.profiles (id, full_name, avatar_url, primary_role)
    VALUES (NEW.id, _name, NEW.raw_user_meta_data->>'avatar_url', _role)
    ON CONFLICT (id) DO UPDATE SET primary_role = EXCLUDED.primary_role;
  END IF;

  RETURN NEW;
END; $function$;

-- Remove student profiles wrongly created for company accounts
DELETE FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'company')
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role IN ('student','university','qa','admin'));