create table if not exists public.shop_audit_logs (
  id bigserial primary key,
  shop_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create or replace function public.log_shop_changes()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.shop_audit_logs (shop_id, action, changed_by, new_data)
    values (new.id, 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.shop_audit_logs (shop_id, action, changed_by, old_data, new_data)
    values (new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.shop_audit_logs (shop_id, action, changed_by, old_data)
    values (old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists shops_audit_trigger on public.shops;

create trigger shops_audit_trigger
after insert or update or delete on public.shops
for each row execute function public.log_shop_changes();
