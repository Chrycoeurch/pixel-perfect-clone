
CREATE POLICY "auth read household photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'household-photos');
CREATE POLICY "agents upload household photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'household-photos' AND (
    public.has_role(auth.uid(), 'agent'::app_role)
    OR public.has_role(auth.uid(), 'president'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  ));
CREATE POLICY "agents delete household photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'household-photos' AND (
    public.has_role(auth.uid(), 'agent'::app_role)
    OR public.has_role(auth.uid(), 'president'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  ));
