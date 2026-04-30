alter table map_route_points
add column if not exists branch_from_id text references map_route_points(id) on delete set null;

create index if not exists map_route_points_branch_from_id_idx
on map_route_points (branch_from_id);
