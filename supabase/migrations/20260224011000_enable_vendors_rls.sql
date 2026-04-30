alter table vendors enable row level security;

create policy "public read vendors"
on vendors
for select
using (true);

create policy "vendor insert self"
on vendors
for insert
with check (auth.uid() = id);

create policy "vendor update self"
on vendors
for update
using (auth.uid() = id)
with check (auth.uid() = id);
