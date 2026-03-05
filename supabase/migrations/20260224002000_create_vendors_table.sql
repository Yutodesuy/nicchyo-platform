create table vendors (
  id uuid primary key references auth.users(id) on delete cascade,

  shop_name text not null,
  owner_name text,
  strength text,
  style text,

  category_id uuid references categories(id),

  must_change_password boolean default true,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
