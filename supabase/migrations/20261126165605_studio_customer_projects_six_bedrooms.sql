-- Backward-compatible range expansion; all owner and geometry policies remain unchanged.
alter table public.studio_customer_projects
  drop constraint studio_customer_projects_bedrooms_check,
  add constraint studio_customer_projects_bedrooms_check check (bedrooms between 1 and 6);
