create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamp with time zone default now()
);
