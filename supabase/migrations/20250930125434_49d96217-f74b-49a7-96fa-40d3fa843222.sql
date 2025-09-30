-- Fix audit log exposure: Restrict audit log viewing to admins only
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.parts_audit_log;

CREATE POLICY "Admins can view audit logs"
ON public.parts_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));