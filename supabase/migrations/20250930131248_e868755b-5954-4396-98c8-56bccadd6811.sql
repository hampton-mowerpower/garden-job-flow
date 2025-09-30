-- Allow counter and admin users to manage parts catalogue
DROP POLICY IF EXISTS "Admins can manage parts" ON public.parts_catalogue;

-- Counter and admin users can insert parts
CREATE POLICY "Counter and admin can insert parts"
ON public.parts_catalogue
FOR INSERT
TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- Counter and admin users can update parts
CREATE POLICY "Counter and admin can update parts"
ON public.parts_catalogue
FOR UPDATE
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- Only admins can delete parts (soft delete)
CREATE POLICY "Admins can delete parts"
ON public.parts_catalogue
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));