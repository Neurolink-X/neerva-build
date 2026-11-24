-- Guest pricing reads must never evaluate the authenticated admin helper.
ALTER POLICY studio_settings_read ON public.studio_feature_settings TO authenticated;
CREATE POLICY studio_settings_published_guest ON public.studio_feature_settings
  FOR SELECT TO anon USING (is_published);
