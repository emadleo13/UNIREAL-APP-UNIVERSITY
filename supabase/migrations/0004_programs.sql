-- UNIREAL phase: sample programs/majors per university (AI-filled). Apply after 0003.

alter table public.universities
  add column if not exists programs jsonb;
