
REVOKE EXECUTE ON FUNCTION public.notify(uuid, text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.project_owner(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_application_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_milestone_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_review_created() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_view_engagement(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_company(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_project(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_engagement_company(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
