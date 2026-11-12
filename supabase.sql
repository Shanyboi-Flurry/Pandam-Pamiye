-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists app_state (
  id int primary key,
  data jsonb not null,
  version bigint not null default 1
);
alter table app_state enable row level security;
create policy "app read"   on app_state for select using (true);
create policy "app insert" on app_state for insert with check (true);
create policy "app update" on app_state for update using (true) with check (true);
