create table product_seasons (
  product_id uuid references products(id) on delete cascade,
  season_id integer references seasons(id) on delete cascade,
  primary key (product_id, season_id)
);
