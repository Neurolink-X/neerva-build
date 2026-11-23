alter table public.studio_customer_projects
  drop constraint studio_customer_projects_floors_check,
  add constraint studio_customer_projects_floors_check check (floors between 1 and 3);
