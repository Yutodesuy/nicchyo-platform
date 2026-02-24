alter table categories enable row level security;

create policy "Public read access"
on categories
for select
to anon, authenticated
using (true);
