drop extension if exists "pg_net";

drop policy "admin_notifications_select_admin" on "public"."admin_notifications";

drop policy "admin_notifications_update_admin" on "public"."admin_notifications";

drop policy "ci_admin_select" on "public"."coupon_impressions";

drop policy "vendors manage own product seasons" on "public"."product_seasons";

drop policy "si_admin_select" on "public"."shop_interactions";

drop policy "vendors manage own knowledge" on "public"."store_knowledge";

drop policy "admins manage web visitor daily uniques" on "public"."web_visitor_daily_uniques";

drop policy "admins read web visitor daily uniques" on "public"."web_visitor_daily_uniques";

drop policy "admins manage web visitor stats" on "public"."web_visitor_stats";

revoke delete on table "public"."admin_notifications" from "anon";

revoke insert on table "public"."admin_notifications" from "anon";

revoke references on table "public"."admin_notifications" from "anon";

revoke select on table "public"."admin_notifications" from "anon";

revoke trigger on table "public"."admin_notifications" from "anon";

revoke truncate on table "public"."admin_notifications" from "anon";

revoke update on table "public"."admin_notifications" from "anon";

revoke delete on table "public"."admin_notifications" from "authenticated";

revoke insert on table "public"."admin_notifications" from "authenticated";

revoke references on table "public"."admin_notifications" from "authenticated";

revoke select on table "public"."admin_notifications" from "authenticated";

revoke trigger on table "public"."admin_notifications" from "authenticated";

revoke truncate on table "public"."admin_notifications" from "authenticated";

revoke update on table "public"."admin_notifications" from "authenticated";

revoke delete on table "public"."admin_notifications" from "service_role";

revoke insert on table "public"."admin_notifications" from "service_role";

revoke references on table "public"."admin_notifications" from "service_role";

revoke select on table "public"."admin_notifications" from "service_role";

revoke trigger on table "public"."admin_notifications" from "service_role";

revoke truncate on table "public"."admin_notifications" from "service_role";

revoke update on table "public"."admin_notifications" from "service_role";

revoke delete on table "public"."coupon_impressions" from "anon";

revoke insert on table "public"."coupon_impressions" from "anon";

revoke references on table "public"."coupon_impressions" from "anon";

revoke select on table "public"."coupon_impressions" from "anon";

revoke trigger on table "public"."coupon_impressions" from "anon";

revoke truncate on table "public"."coupon_impressions" from "anon";

revoke update on table "public"."coupon_impressions" from "anon";

revoke delete on table "public"."coupon_impressions" from "authenticated";

revoke insert on table "public"."coupon_impressions" from "authenticated";

revoke references on table "public"."coupon_impressions" from "authenticated";

revoke select on table "public"."coupon_impressions" from "authenticated";

revoke trigger on table "public"."coupon_impressions" from "authenticated";

revoke truncate on table "public"."coupon_impressions" from "authenticated";

revoke update on table "public"."coupon_impressions" from "authenticated";

revoke delete on table "public"."coupon_impressions" from "service_role";

revoke insert on table "public"."coupon_impressions" from "service_role";

revoke references on table "public"."coupon_impressions" from "service_role";

revoke select on table "public"."coupon_impressions" from "service_role";

revoke trigger on table "public"."coupon_impressions" from "service_role";

revoke truncate on table "public"."coupon_impressions" from "service_role";

revoke update on table "public"."coupon_impressions" from "service_role";

revoke delete on table "public"."shop_interactions" from "anon";

revoke insert on table "public"."shop_interactions" from "anon";

revoke references on table "public"."shop_interactions" from "anon";

revoke select on table "public"."shop_interactions" from "anon";

revoke trigger on table "public"."shop_interactions" from "anon";

revoke truncate on table "public"."shop_interactions" from "anon";

revoke update on table "public"."shop_interactions" from "anon";

revoke delete on table "public"."shop_interactions" from "authenticated";

revoke insert on table "public"."shop_interactions" from "authenticated";

revoke references on table "public"."shop_interactions" from "authenticated";

revoke select on table "public"."shop_interactions" from "authenticated";

revoke trigger on table "public"."shop_interactions" from "authenticated";

revoke truncate on table "public"."shop_interactions" from "authenticated";

revoke update on table "public"."shop_interactions" from "authenticated";

revoke delete on table "public"."shop_interactions" from "service_role";

revoke insert on table "public"."shop_interactions" from "service_role";

revoke references on table "public"."shop_interactions" from "service_role";

revoke select on table "public"."shop_interactions" from "service_role";

revoke trigger on table "public"."shop_interactions" from "service_role";

revoke truncate on table "public"."shop_interactions" from "service_role";

revoke update on table "public"."shop_interactions" from "service_role";

alter table "public"."product_seasons" drop constraint "product_seasons_product_id_fkey";

alter table "public"."shop_interactions" drop constraint "shop_interactions_shop_id_fkey";

alter table "public"."admin_notifications" drop constraint "admin_notifications_pkey";

alter table "public"."coupon_impressions" drop constraint "coupon_impressions_pkey";

alter table "public"."shop_interactions" drop constraint "shop_interactions_pkey";

drop index if exists "public"."admin_notifications_created_at_idx";

drop index if exists "public"."admin_notifications_is_read_idx";

drop index if exists "public"."admin_notifications_pkey";

drop index if exists "public"."coupon_impressions_pkey";

drop index if exists "public"."idx_ci_coupon_id";

drop index if exists "public"."idx_ci_shop_id";

drop index if exists "public"."idx_ci_visitor";

drop index if exists "public"."idx_si_event_type";

drop index if exists "public"."idx_si_shop_id";

drop index if exists "public"."shop_interactions_pkey";

drop index if exists "public"."idx_store_knowledge_store_id";

drop table "public"."admin_notifications";

drop table "public"."coupon_impressions";

drop table "public"."shop_interactions";


  create table "public"."knowledge_embeddings" (
    "id" text not null,
    "category" text,
    "title" text,
    "content" text,
    "image_url" text,
    "embedding" public.vector(1536)
      );


alter table "public"."knowledge_embeddings" enable row level security;


  create table "public"."shop_attendance_vendor" (
    "id" uuid not null default gen_random_uuid(),
    "shop_id" uuid not null,
    "vendor_id" uuid not null,
    "vote_date" date not null,
    "is_open" boolean not null,
    "vendor_confirmed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shop_attendance_vendor" enable row level security;


  create table "public"."shop_attendance_votes" (
    "id" uuid not null default gen_random_uuid(),
    "shop_id" uuid not null,
    "user_id" uuid not null,
    "vote_date" date not null,
    "vote_yes" boolean not null,
    "weight" numeric not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shop_attendance_votes" enable row level security;


  create table "public"."shops_import" (
    "legacy_id" integer,
    "lat" numeric,
    "lng" numeric
      );


alter table "public"."shops_import" enable row level security;


  create table "public"."shops_name_staging" (
    "id" uuid not null,
    "name" text not null
      );


alter table "public"."shops_name_staging" enable row level security;


  create table "public"."shops_strong" (
    "legacy_id" integer,
    "shop_strength" text
      );


alter table "public"."shops_strong" enable row level security;


  create table "public"."shops_topic_import" (
    "id" uuid not null,
    "topic" jsonb
      );


alter table "public"."shops_topic_import" enable row level security;


  create table "public"."todos" (
    "id" uuid not null default gen_random_uuid(),
    "todo" text not null
      );


alter table "public"."todos" enable row level security;

alter table "public"."store_knowledge" alter column "store_id" set data type uuid using "store_id"::uuid;

alter table "public"."vendor_embeddings" enable row level security;

CREATE INDEX knowledge_embeddings_embedding_idx ON public.knowledge_embeddings USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');

CREATE UNIQUE INDEX knowledge_embeddings_pkey ON public.knowledge_embeddings USING btree (id);

CREATE INDEX location_assignments_market_date_idx ON public.location_assignments USING btree (market_date);

CREATE INDEX location_assignments_vendor_id_idx ON public.location_assignments USING btree (vendor_id);

CREATE UNIQUE INDEX shop_attendance_vendor_pkey ON public.shop_attendance_vendor USING btree (id);

CREATE UNIQUE INDEX shop_attendance_votes_pkey ON public.shop_attendance_votes USING btree (id);

CREATE INDEX shop_page_views_vendor_id_idx ON public.shop_page_views USING btree (vendor_id);

CREATE INDEX shop_page_views_viewed_at_idx ON public.shop_page_views USING btree (viewed_at);

CREATE UNIQUE INDEX shops_name_staging_pkey ON public.shops_name_staging USING btree (id);

CREATE UNIQUE INDEX shops_topic_import_pkey ON public.shops_topic_import USING btree (id);

CREATE UNIQUE INDEX todos_pkey ON public.todos USING btree (id);

CREATE INDEX vendor_contents_expires_at_idx ON public.vendor_contents USING btree (expires_at);

CREATE INDEX vendor_contents_vendor_id_idx ON public.vendor_contents USING btree (vendor_id);

CREATE INDEX vendors_category_id_idx ON public.vendors USING btree (category_id);

CREATE INDEX vendors_role_idx ON public.vendors USING btree (role);

CREATE INDEX idx_store_knowledge_store_id ON public.store_knowledge USING btree (store_id);

alter table "public"."knowledge_embeddings" add constraint "knowledge_embeddings_pkey" PRIMARY KEY using index "knowledge_embeddings_pkey";

alter table "public"."shop_attendance_vendor" add constraint "shop_attendance_vendor_pkey" PRIMARY KEY using index "shop_attendance_vendor_pkey";

alter table "public"."shop_attendance_votes" add constraint "shop_attendance_votes_pkey" PRIMARY KEY using index "shop_attendance_votes_pkey";

alter table "public"."shops_name_staging" add constraint "shops_name_staging_pkey" PRIMARY KEY using index "shops_name_staging_pkey";

alter table "public"."shops_topic_import" add constraint "shops_topic_import_pkey" PRIMARY KEY using index "shops_topic_import_pkey";

alter table "public"."todos" add constraint "todos_pkey" PRIMARY KEY using index "todos_pkey";

alter table "public"."shop_attendance_vendor" add constraint "shop_attendance_vendor_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shop_attendance_vendor" validate constraint "shop_attendance_vendor_vendor_id_fkey";

alter table "public"."shop_attendance_votes" add constraint "shop_attendance_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shop_attendance_votes" validate constraint "shop_attendance_votes_user_id_fkey";

alter table "public"."store_knowledge" add constraint "store_knowledge_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.vendors(id) ON DELETE CASCADE not valid;

alter table "public"."store_knowledge" validate constraint "store_knowledge_store_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_shop_attendance_estimates(target_date date)
 RETURNS TABLE(shop_id uuid, label text, p numeric, n_eff numeric, vendor_override boolean, evidence_summary text)
 LANGUAGE sql
 STABLE
AS $function$
  with
  votes as (
    select
      shop_id,
      sum(case when vote_yes then weight else 0 end) as yes_w,
      sum(case when not vote_yes then weight else 0 end) as no_w,
      sum(weight) as n_eff
    from public.shop_attendance_votes
    where vote_date = target_date
    group by shop_id
  ),
  vendor as (
    select shop_id, is_open, vendor_confirmed
    from public.shop_attendance_vendor
    where vote_date = target_date and vendor_confirmed = true
  ),
  prior as (
    select 5::numeric as prior_yes, 5::numeric as prior_no
  )
  select
    s.id as shop_id,
    case
      when v.vendor_confirmed = true and v.is_open = true then '出店している'
      when v.vendor_confirmed = true and v.is_open = false then '出店していない'
      when coalesce(vt.n_eff, 0) < 3 then 'わからない'
      else case
        when ((prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))) >= 0.85
          then '出店している可能性が高い'
        when ((prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))) >= 0.70
          then 'おそらく出店している'
        when ((prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))) > 0.20
          and ((prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))) < 0.50
          then '出店していないかもしれない'
        when ((prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))) <= 0.20
          then '出店していない可能性が高い'
        else 'おそらく出店している'
      end
    end as label,
    case
      when v.vendor_confirmed = true then null
      else (prior.prior_yes + coalesce(vt.yes_w,0)) / (prior.prior_yes + prior.prior_no +
  coalesce(vt.yes_w,0) + coalesce(vt.no_w,0))
    end as p,
    coalesce(vt.n_eff, 0) as n_eff,
    coalesce(v.vendor_confirmed, false) as vendor_override,
    concat(
      'yes=', coalesce(vt.yes_w,0),
      ', no=', coalesce(vt.no_w,0),
      ', N_eff=', coalesce(vt.n_eff,0)
    ) as evidence_summary
  from public.shops s
  left join votes vt on vt.shop_id = s.id
  left join vendor v on v.shop_id = s.id
  cross join prior;
  $function$
;

CREATE OR REPLACE FUNCTION public.match_knowledge_embeddings(query_embedding public.vector, match_count integer, match_threshold double precision)
 RETURNS TABLE(id text, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
    select
      id,
      1 - (embedding <=> query_embedding) as similarity
    from public.knowledge_embeddings
    where 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit match_count;
  $function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  begin
    new.updated_at = now();
    return new;
  end;
  $function$
;

CREATE OR REPLACE FUNCTION public.match_vendor_embeddings(query_embedding public.vector, match_count integer, match_threshold double precision)
 RETURNS TABLE(vendor_id uuid, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
begin
  if to_regclass('public.vendor_embeddings') is null then
    return;
  end if;

  return query execute
    'select
      vendor_id,
      1 - (embedding <=> $1) as similarity
    from public.vendor_embeddings
    where 1 - (embedding <=> $1) > $2
    order by embedding <=> $1
    limit $3'
  using query_embedding, match_threshold, match_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_kotodute_reported()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    IF NEW.report_count >= 1 AND OLD.report_count = 0 THEN
      INSERT INTO admin_notifications (type, title, body, link)
      VALUES (
        'kotodute_reported',
        'ことづてが報告されました',
        LEFT(NEW.body, 50) || CASE WHEN char_length(NEW.body) > 50 THEN '...' ELSE '' END,
        '/admin/kotodute'
      );
    END IF;
    RETURN NEW;
  END;
  $function$
;

grant delete on table "public"."knowledge_embeddings" to "anon";

grant insert on table "public"."knowledge_embeddings" to "anon";

grant references on table "public"."knowledge_embeddings" to "anon";

grant select on table "public"."knowledge_embeddings" to "anon";

grant trigger on table "public"."knowledge_embeddings" to "anon";

grant truncate on table "public"."knowledge_embeddings" to "anon";

grant update on table "public"."knowledge_embeddings" to "anon";

grant delete on table "public"."knowledge_embeddings" to "authenticated";

grant insert on table "public"."knowledge_embeddings" to "authenticated";

grant references on table "public"."knowledge_embeddings" to "authenticated";

grant select on table "public"."knowledge_embeddings" to "authenticated";

grant trigger on table "public"."knowledge_embeddings" to "authenticated";

grant truncate on table "public"."knowledge_embeddings" to "authenticated";

grant update on table "public"."knowledge_embeddings" to "authenticated";

grant delete on table "public"."knowledge_embeddings" to "service_role";

grant insert on table "public"."knowledge_embeddings" to "service_role";

grant references on table "public"."knowledge_embeddings" to "service_role";

grant select on table "public"."knowledge_embeddings" to "service_role";

grant trigger on table "public"."knowledge_embeddings" to "service_role";

grant truncate on table "public"."knowledge_embeddings" to "service_role";

grant update on table "public"."knowledge_embeddings" to "service_role";

grant delete on table "public"."shop_attendance_vendor" to "anon";

grant insert on table "public"."shop_attendance_vendor" to "anon";

grant references on table "public"."shop_attendance_vendor" to "anon";

grant select on table "public"."shop_attendance_vendor" to "anon";

grant trigger on table "public"."shop_attendance_vendor" to "anon";

grant truncate on table "public"."shop_attendance_vendor" to "anon";

grant update on table "public"."shop_attendance_vendor" to "anon";

grant delete on table "public"."shop_attendance_vendor" to "authenticated";

grant insert on table "public"."shop_attendance_vendor" to "authenticated";

grant references on table "public"."shop_attendance_vendor" to "authenticated";

grant select on table "public"."shop_attendance_vendor" to "authenticated";

grant trigger on table "public"."shop_attendance_vendor" to "authenticated";

grant truncate on table "public"."shop_attendance_vendor" to "authenticated";

grant update on table "public"."shop_attendance_vendor" to "authenticated";

grant delete on table "public"."shop_attendance_vendor" to "service_role";

grant insert on table "public"."shop_attendance_vendor" to "service_role";

grant references on table "public"."shop_attendance_vendor" to "service_role";

grant select on table "public"."shop_attendance_vendor" to "service_role";

grant trigger on table "public"."shop_attendance_vendor" to "service_role";

grant truncate on table "public"."shop_attendance_vendor" to "service_role";

grant update on table "public"."shop_attendance_vendor" to "service_role";

grant delete on table "public"."shop_attendance_votes" to "anon";

grant insert on table "public"."shop_attendance_votes" to "anon";

grant references on table "public"."shop_attendance_votes" to "anon";

grant select on table "public"."shop_attendance_votes" to "anon";

grant trigger on table "public"."shop_attendance_votes" to "anon";

grant truncate on table "public"."shop_attendance_votes" to "anon";

grant update on table "public"."shop_attendance_votes" to "anon";

grant delete on table "public"."shop_attendance_votes" to "authenticated";

grant insert on table "public"."shop_attendance_votes" to "authenticated";

grant references on table "public"."shop_attendance_votes" to "authenticated";

grant select on table "public"."shop_attendance_votes" to "authenticated";

grant trigger on table "public"."shop_attendance_votes" to "authenticated";

grant truncate on table "public"."shop_attendance_votes" to "authenticated";

grant update on table "public"."shop_attendance_votes" to "authenticated";

grant delete on table "public"."shop_attendance_votes" to "service_role";

grant insert on table "public"."shop_attendance_votes" to "service_role";

grant references on table "public"."shop_attendance_votes" to "service_role";

grant select on table "public"."shop_attendance_votes" to "service_role";

grant trigger on table "public"."shop_attendance_votes" to "service_role";

grant truncate on table "public"."shop_attendance_votes" to "service_role";

grant update on table "public"."shop_attendance_votes" to "service_role";

grant delete on table "public"."shops_import" to "anon";

grant insert on table "public"."shops_import" to "anon";

grant references on table "public"."shops_import" to "anon";

grant select on table "public"."shops_import" to "anon";

grant trigger on table "public"."shops_import" to "anon";

grant truncate on table "public"."shops_import" to "anon";

grant update on table "public"."shops_import" to "anon";

grant delete on table "public"."shops_import" to "authenticated";

grant insert on table "public"."shops_import" to "authenticated";

grant references on table "public"."shops_import" to "authenticated";

grant select on table "public"."shops_import" to "authenticated";

grant trigger on table "public"."shops_import" to "authenticated";

grant truncate on table "public"."shops_import" to "authenticated";

grant update on table "public"."shops_import" to "authenticated";

grant delete on table "public"."shops_import" to "service_role";

grant insert on table "public"."shops_import" to "service_role";

grant references on table "public"."shops_import" to "service_role";

grant select on table "public"."shops_import" to "service_role";

grant trigger on table "public"."shops_import" to "service_role";

grant truncate on table "public"."shops_import" to "service_role";

grant update on table "public"."shops_import" to "service_role";

grant delete on table "public"."shops_name_staging" to "anon";

grant insert on table "public"."shops_name_staging" to "anon";

grant references on table "public"."shops_name_staging" to "anon";

grant select on table "public"."shops_name_staging" to "anon";

grant trigger on table "public"."shops_name_staging" to "anon";

grant truncate on table "public"."shops_name_staging" to "anon";

grant update on table "public"."shops_name_staging" to "anon";

grant delete on table "public"."shops_name_staging" to "authenticated";

grant insert on table "public"."shops_name_staging" to "authenticated";

grant references on table "public"."shops_name_staging" to "authenticated";

grant select on table "public"."shops_name_staging" to "authenticated";

grant trigger on table "public"."shops_name_staging" to "authenticated";

grant truncate on table "public"."shops_name_staging" to "authenticated";

grant update on table "public"."shops_name_staging" to "authenticated";

grant delete on table "public"."shops_name_staging" to "service_role";

grant insert on table "public"."shops_name_staging" to "service_role";

grant references on table "public"."shops_name_staging" to "service_role";

grant select on table "public"."shops_name_staging" to "service_role";

grant trigger on table "public"."shops_name_staging" to "service_role";

grant truncate on table "public"."shops_name_staging" to "service_role";

grant update on table "public"."shops_name_staging" to "service_role";

grant delete on table "public"."shops_strong" to "anon";

grant insert on table "public"."shops_strong" to "anon";

grant references on table "public"."shops_strong" to "anon";

grant select on table "public"."shops_strong" to "anon";

grant trigger on table "public"."shops_strong" to "anon";

grant truncate on table "public"."shops_strong" to "anon";

grant update on table "public"."shops_strong" to "anon";

grant delete on table "public"."shops_strong" to "authenticated";

grant insert on table "public"."shops_strong" to "authenticated";

grant references on table "public"."shops_strong" to "authenticated";

grant select on table "public"."shops_strong" to "authenticated";

grant trigger on table "public"."shops_strong" to "authenticated";

grant truncate on table "public"."shops_strong" to "authenticated";

grant update on table "public"."shops_strong" to "authenticated";

grant delete on table "public"."shops_strong" to "service_role";

grant insert on table "public"."shops_strong" to "service_role";

grant references on table "public"."shops_strong" to "service_role";

grant select on table "public"."shops_strong" to "service_role";

grant trigger on table "public"."shops_strong" to "service_role";

grant truncate on table "public"."shops_strong" to "service_role";

grant update on table "public"."shops_strong" to "service_role";

grant delete on table "public"."shops_topic_import" to "anon";

grant insert on table "public"."shops_topic_import" to "anon";

grant references on table "public"."shops_topic_import" to "anon";

grant select on table "public"."shops_topic_import" to "anon";

grant trigger on table "public"."shops_topic_import" to "anon";

grant truncate on table "public"."shops_topic_import" to "anon";

grant update on table "public"."shops_topic_import" to "anon";

grant delete on table "public"."shops_topic_import" to "authenticated";

grant insert on table "public"."shops_topic_import" to "authenticated";

grant references on table "public"."shops_topic_import" to "authenticated";

grant select on table "public"."shops_topic_import" to "authenticated";

grant trigger on table "public"."shops_topic_import" to "authenticated";

grant truncate on table "public"."shops_topic_import" to "authenticated";

grant update on table "public"."shops_topic_import" to "authenticated";

grant delete on table "public"."shops_topic_import" to "service_role";

grant insert on table "public"."shops_topic_import" to "service_role";

grant references on table "public"."shops_topic_import" to "service_role";

grant select on table "public"."shops_topic_import" to "service_role";

grant trigger on table "public"."shops_topic_import" to "service_role";

grant truncate on table "public"."shops_topic_import" to "service_role";

grant update on table "public"."shops_topic_import" to "service_role";

grant delete on table "public"."todos" to "anon";

grant insert on table "public"."todos" to "anon";

grant references on table "public"."todos" to "anon";

grant select on table "public"."todos" to "anon";

grant trigger on table "public"."todos" to "anon";

grant truncate on table "public"."todos" to "anon";

grant update on table "public"."todos" to "anon";

grant delete on table "public"."todos" to "authenticated";

grant insert on table "public"."todos" to "authenticated";

grant references on table "public"."todos" to "authenticated";

grant select on table "public"."todos" to "authenticated";

grant trigger on table "public"."todos" to "authenticated";

grant truncate on table "public"."todos" to "authenticated";

grant update on table "public"."todos" to "authenticated";

grant delete on table "public"."todos" to "service_role";

grant insert on table "public"."todos" to "service_role";

grant references on table "public"."todos" to "service_role";

grant select on table "public"."todos" to "service_role";

grant trigger on table "public"."todos" to "service_role";

grant truncate on table "public"."todos" to "service_role";

grant update on table "public"."todos" to "service_role";


  create policy "vendor_insert_self"
  on "public"."shop_attendance_vendor"
  as permissive
  for insert
  to public
with check ((auth.uid() = vendor_id));



  create policy "vendor_select_all"
  on "public"."shop_attendance_vendor"
  as permissive
  for select
  to public
using (true);



  create policy "votes_insert_self"
  on "public"."shop_attendance_votes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "votes_select_all"
  on "public"."shop_attendance_votes"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."todos"
  as permissive
  for select
  to public
using (true);



  create policy "vendors manage own knowledge"
  on "public"."store_knowledge"
  as permissive
  for all
  to public
using ((auth.uid() = store_id))
with check ((auth.uid() = store_id));



  create policy "admins manage web visitor daily uniques"
  on "public"."web_visitor_daily_uniques"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = auth.uid()) AND (vendors.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = auth.uid()) AND (vendors.role = 'admin'::text)))));



  create policy "admins read web visitor daily uniques"
  on "public"."web_visitor_daily_uniques"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = auth.uid()) AND (vendors.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));



  create policy "admins manage web visitor stats"
  on "public"."web_visitor_stats"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = auth.uid()) AND (vendors.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = auth.uid()) AND (vendors.role = 'admin'::text)))));



