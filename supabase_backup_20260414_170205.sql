


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."get_shop_attendance_estimates"("target_date" "date") RETURNS TABLE("shop_id" "uuid", "label" "text", "p" numeric, "n_eff" numeric, "vendor_override" boolean, "evidence_summary" "text")
    LANGUAGE "sql" STABLE
    AS $$
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
  $$;


ALTER FUNCTION "public"."get_shop_attendance_estimates"("target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_knowledge_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) RETURNS TABLE("id" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
    select
      id,
      1 - (embedding <=> query_embedding) as similarity
    from public.knowledge_embeddings
    where 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit match_count;
  $$;


ALTER FUNCTION "public"."match_knowledge_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_store_knowledge"("query_embedding" "public"."vector", "target_store_id" "text", "match_count" integer DEFAULT 3, "match_threshold" double precision DEFAULT 0.5) RETURNS TABLE("id" "uuid", "store_id" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
    select
      sk.id,
      sk.store_id,
      sk.content,
      1 - (sk.embedding <=> query_embedding) as similarity
    from public.store_knowledge sk
    where
      sk.store_id = target_store_id
      and sk.embedding is not null
      and 1 - (sk.embedding <=> query_embedding) > match_threshold
    order by sk.embedding <=> query_embedding
    limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_store_knowledge"("query_embedding" "public"."vector", "target_store_id" "text", "match_count" integer, "match_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_vendor_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) RETURNS TABLE("vendor_id" "uuid", "similarity" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $_$
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
$_$;


ALTER FUNCTION "public"."match_vendor_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_kotodute_reported"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
  $$;


ALTER FUNCTION "public"."notify_kotodute_reported"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
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
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_home_visit"("p_visit_date" "date", "p_visitor_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  inserted_count integer;
begin
  insert into web_visitor_daily_uniques (visit_date, visitor_key)
  values (p_visit_date, p_visitor_key)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return false;
  end if;

  insert into web_visitor_stats (visit_date, visitor_count)
  values (p_visit_date, 1)
  on conflict (visit_date) do update
    set visitor_count = web_visitor_stats.visitor_count + 1,
        updated_at = now();

  return true;
end;
$$;


ALTER FUNCTION "public"."track_home_visit"("p_visit_date" "date", "p_visitor_key" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" bigint NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "actor_role" "text",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "text",
    "target_name" "text",
    "details" "text",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."admin_audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."admin_audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."admin_audit_logs_id_seq" OWNED BY "public"."admin_audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_abuse_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visitor_key" "text"
);


ALTER TABLE "public"."ai_abuse_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_abuse_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text",
    "event_type" "text" NOT NULL,
    "message" "text",
    "severity" integer DEFAULT 1 NOT NULL,
    "blocked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visitor_key" "text"
);


ALTER TABLE "public"."ai_abuse_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_consult_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "text",
    "question_text" "text" NOT NULL,
    "intent_category" "text",
    "keywords" "text"[] DEFAULT '{}'::"text"[],
    "location_type" "text" DEFAULT 'unknown'::"text",
    "is_recommendation" boolean DEFAULT false,
    "consulted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visitor_key" "text"
);


ALTER TABLE "public"."ai_consult_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_issuances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_key" "text" NOT NULL,
    "market_date" "date" NOT NULL,
    "coupon_type_id" "uuid" NOT NULL,
    "amount" integer DEFAULT 50 NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_at" timestamp with time zone,
    "used_vendor_id" "uuid",
    "issue_reason" "text" DEFAULT 'initial'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coupon_issuances_issue_reason_check" CHECK (("issue_reason" = ANY (ARRAY['initial'::"text", 'next_visit'::"text"])))
);


ALTER TABLE "public"."coupon_issuances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_redemption_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coupon_issuance_id" "uuid" NOT NULL,
    "visitor_key" "text" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "coupon_type_id" "uuid" NOT NULL,
    "market_date" "date" NOT NULL,
    "amount_discounted" integer DEFAULT 50 NOT NULL,
    "is_new_stamp" boolean DEFAULT false NOT NULL,
    "next_coupon_issued" boolean DEFAULT false NOT NULL,
    "next_coupon_type_id" "uuid",
    "confirmed_by" "uuid",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coupon_redemption_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_stamps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_key" "text" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "market_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coupon_stamps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "emoji" "text" DEFAULT '🎟️'::"text" NOT NULL,
    "amount" integer DEFAULT 50 NOT NULL,
    "is_initial_gift" boolean DEFAULT false NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coupon_types_amount_check" CHECK (("amount" > 0))
);


ALTER TABLE "public"."coupon_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_embeddings" (
    "id" "text" NOT NULL,
    "category" "text",
    "title" "text",
    "content" "text",
    "image_url" "text",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."knowledge_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kotodutes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_key" "text" NOT NULL,
    "vendor_id" "uuid",
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'published'::"text" NOT NULL,
    "report_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kotodutes_body_check" CHECK ((("char_length"("body") >= 1) AND ("char_length"("body") <= 500))),
    CONSTRAINT "kotodutes_status_check" CHECK (("status" = ANY (ARRAY['published'::"text", 'hidden'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."kotodutes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "market_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."location_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."map_landmarks" (
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "image_url" "text" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "width_px" double precision NOT NULL,
    "height_px" double precision NOT NULL,
    "show_at_min_zoom" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "map_landmarks_height_px_check" CHECK (("height_px" > (0)::double precision)),
    CONSTRAINT "map_landmarks_width_px_check" CHECK (("width_px" > (0)::double precision))
);


ALTER TABLE "public"."map_landmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."map_layout_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shops_json" "jsonb" NOT NULL,
    "landmarks_json" "jsonb" NOT NULL,
    "created_by" "uuid",
    "summary" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "route_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "route_config_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."map_layout_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."map_route_configs" (
    "key" "text" NOT NULL,
    "road_half_width_meters" double precision DEFAULT 15.6 NOT NULL,
    "snap_distance_meters" double precision DEFAULT 18 NOT NULL,
    "visible_distance_meters" double precision DEFAULT 42 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."map_route_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."map_route_points" (
    "id" "text" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "branch_from_id" "text"
);


ALTER TABLE "public"."map_route_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_number" integer NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "district" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."market_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "sale_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_sales_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."product_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_search_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword" "text" NOT NULL,
    "result_count" integer DEFAULT 0 NOT NULL,
    "searched_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_search_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_seasons" (
    "product_id" "uuid" NOT NULL,
    "season_id" integer NOT NULL
);


ALTER TABLE "public"."product_seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "price" integer,
    "is_available" boolean DEFAULT true,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_attendance_vendor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "vote_date" "date" NOT NULL,
    "is_open" boolean NOT NULL,
    "vendor_confirmed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_attendance_vendor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_attendance_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote_date" "date" NOT NULL,
    "vote_yes" boolean NOT NULL,
    "weight" numeric DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_attendance_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "source" "text" DEFAULT 'direct'::"text",
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shops_import" (
    "legacy_id" integer,
    "lat" numeric,
    "lng" numeric
);


ALTER TABLE "public"."shops_import" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shops_name_staging" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."shops_name_staging" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shops_strong" (
    "legacy_id" integer,
    "shop_strength" "text"
);


ALTER TABLE "public"."shops_strong" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shops_topic_import" (
    "id" "uuid" NOT NULL,
    "topic" "jsonb"
);


ALTER TABLE "public"."shops_topic_import" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_knowledge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "todo" "text" NOT NULL
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text",
    "body" "text",
    "category_id" "uuid",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "vendor_contents_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'hidden'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."vendor_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_coupon_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "coupon_type_id" "uuid" NOT NULL,
    "is_participating" boolean DEFAULT false NOT NULL,
    "min_purchase_amount" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vendor_coupon_settings_min_purchase_amount_check" CHECK (("min_purchase_amount" = ANY (ARRAY[0, 300, 500, 1000])))
);


ALTER TABLE "public"."vendor_coupon_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_embeddings" (
    "vendor_id" "uuid" NOT NULL,
    "store_number" integer,
    "shop_name" "text",
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vendor_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" NOT NULL,
    "shop_name" "text" NOT NULL,
    "owner_name" "text",
    "strength" "text",
    "style" "text",
    "category_id" "uuid",
    "must_change_password" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'vendor'::"text",
    "main_products" "text"[] DEFAULT '{}'::"text"[],
    "payment_methods" "text"[] DEFAULT '{}'::"text"[],
    "rain_policy" "text" DEFAULT 'undecided'::"text",
    "schedule" "text"[] DEFAULT '{}'::"text"[],
    "style_tags" "text"[] DEFAULT '{}'::"text"[],
    "main_product_prices" "jsonb" DEFAULT '{}'::"jsonb",
    "shop_image_url" "text",
    "sns_instagram" "text",
    "sns_x" "text",
    "sns_hp" "text",
    "business_hours_start" "text",
    "business_hours_end" "text"
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_page_analytics" (
    "id" bigint NOT NULL,
    "visit_date" "date" NOT NULL,
    "visitor_key" "text" NOT NULL,
    "path" "text" NOT NULL,
    "duration_seconds" integer NOT NULL,
    "user_id" "uuid",
    "user_role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "web_page_analytics_duration_seconds_check" CHECK ((("duration_seconds" >= 0) AND ("duration_seconds" <= 86400)))
);


ALTER TABLE "public"."web_page_analytics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."web_page_analytics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."web_page_analytics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."web_page_analytics_id_seq" OWNED BY "public"."web_page_analytics"."id";



CREATE TABLE IF NOT EXISTS "public"."web_visitor_daily_uniques" (
    "visit_date" "date" NOT NULL,
    "visitor_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."web_visitor_daily_uniques" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_visitor_stats" (
    "visit_date" "date" NOT NULL,
    "visitor_count" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "web_visitor_stats_visitor_count_check" CHECK (("visitor_count" >= 0))
);


ALTER TABLE "public"."web_visitor_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."admin_audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."web_page_analytics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."web_page_analytics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_abuse_blocks"
    ADD CONSTRAINT "ai_abuse_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_abuse_events"
    ADD CONSTRAINT "ai_abuse_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_consult_logs"
    ADD CONSTRAINT "ai_consult_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_issuances"
    ADD CONSTRAINT "coupon_issuances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_stamps"
    ADD CONSTRAINT "coupon_stamps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_stamps"
    ADD CONSTRAINT "coupon_stamps_visitor_key_vendor_id_market_date_key" UNIQUE ("visitor_key", "vendor_id", "market_date");



ALTER TABLE ONLY "public"."coupon_types"
    ADD CONSTRAINT "coupon_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_embeddings"
    ADD CONSTRAINT "knowledge_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kotodutes"
    ADD CONSTRAINT "kotodutes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_assignments"
    ADD CONSTRAINT "location_assignments_location_id_market_date_key" UNIQUE ("location_id", "market_date");



ALTER TABLE ONLY "public"."location_assignments"
    ADD CONSTRAINT "location_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."map_landmarks"
    ADD CONSTRAINT "map_landmarks_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."map_layout_snapshots"
    ADD CONSTRAINT "map_layout_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."map_route_configs"
    ADD CONSTRAINT "map_route_configs_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."map_route_points"
    ADD CONSTRAINT "map_route_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_locations"
    ADD CONSTRAINT "market_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_locations"
    ADD CONSTRAINT "market_locations_store_number_key" UNIQUE ("store_number");



ALTER TABLE ONLY "public"."product_sales"
    ADD CONSTRAINT "product_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_sales"
    ADD CONSTRAINT "product_sales_vendor_id_product_name_sale_date_key" UNIQUE ("vendor_id", "product_name", "sale_date");



ALTER TABLE ONLY "public"."product_search_logs"
    ADD CONSTRAINT "product_search_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_seasons"
    ADD CONSTRAINT "product_seasons_pkey" PRIMARY KEY ("product_id", "season_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_attendance_vendor"
    ADD CONSTRAINT "shop_attendance_vendor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_attendance_votes"
    ADD CONSTRAINT "shop_attendance_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_page_views"
    ADD CONSTRAINT "shop_page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shops_name_staging"
    ADD CONSTRAINT "shops_name_staging_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shops_topic_import"
    ADD CONSTRAINT "shops_topic_import_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_knowledge"
    ADD CONSTRAINT "store_knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_contents"
    ADD CONSTRAINT "vendor_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_coupon_settings"
    ADD CONSTRAINT "vendor_coupon_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_coupon_settings"
    ADD CONSTRAINT "vendor_coupon_settings_vendor_id_coupon_type_id_key" UNIQUE ("vendor_id", "coupon_type_id");



ALTER TABLE ONLY "public"."vendor_embeddings"
    ADD CONSTRAINT "vendor_embeddings_pkey" PRIMARY KEY ("vendor_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_page_analytics"
    ADD CONSTRAINT "web_page_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_visitor_daily_uniques"
    ADD CONSTRAINT "web_visitor_daily_uniques_pkey" PRIMARY KEY ("visit_date", "visitor_key");



ALTER TABLE ONLY "public"."web_visitor_stats"
    ADD CONSTRAINT "web_visitor_stats_pkey" PRIMARY KEY ("visit_date");



CREATE INDEX "admin_audit_logs_action_idx" ON "public"."admin_audit_logs" USING "btree" ("action");



CREATE INDEX "admin_audit_logs_actor_id_idx" ON "public"."admin_audit_logs" USING "btree" ("actor_id");



CREATE INDEX "admin_audit_logs_created_at_idx" ON "public"."admin_audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "ai_abuse_blocks_active_idx" ON "public"."ai_abuse_blocks" USING "btree" ("is_active");



CREATE INDEX "ai_abuse_blocks_ip_idx" ON "public"."ai_abuse_blocks" USING "btree" ("ip_address");



CREATE INDEX "ai_abuse_blocks_visitor_key_idx" ON "public"."ai_abuse_blocks" USING "btree" ("visitor_key");



CREATE INDEX "ai_abuse_events_created_at_idx" ON "public"."ai_abuse_events" USING "btree" ("created_at" DESC);



CREATE INDEX "ai_abuse_events_ip_idx" ON "public"."ai_abuse_events" USING "btree" ("ip_address");



CREATE INDEX "idx_ai_consult_logs_consulted_at" ON "public"."ai_consult_logs" USING "btree" ("consulted_at");



CREATE INDEX "idx_ai_consult_logs_ip_created" ON "public"."ai_consult_logs" USING "btree" ("ip_address", "created_at" DESC);



CREATE INDEX "idx_ai_consult_logs_store_id" ON "public"."ai_consult_logs" USING "btree" ("store_id");



CREATE INDEX "idx_ai_consult_logs_visitor_key" ON "public"."ai_consult_logs" USING "btree" ("visitor_key", "created_at" DESC);



CREATE INDEX "idx_ci_expires_at" ON "public"."coupon_issuances" USING "btree" ("expires_at");



CREATE INDEX "idx_ci_used_vendor" ON "public"."coupon_issuances" USING "btree" ("used_vendor_id", "market_date");



CREATE INDEX "idx_ci_visitor_market" ON "public"."coupon_issuances" USING "btree" ("visitor_key", "market_date", "is_used");



CREATE INDEX "idx_crl_market_date" ON "public"."coupon_redemption_logs" USING "btree" ("market_date");



CREATE INDEX "idx_crl_vendor_market" ON "public"."coupon_redemption_logs" USING "btree" ("vendor_id", "market_date");



CREATE INDEX "idx_crl_visitor_key" ON "public"."coupon_redemption_logs" USING "btree" ("visitor_key", "market_date");



CREATE INDEX "idx_cs_visitor_market" ON "public"."coupon_stamps" USING "btree" ("visitor_key", "market_date");



CREATE INDEX "idx_product_search_logs_keyword" ON "public"."product_search_logs" USING "btree" ("keyword");



CREATE INDEX "idx_product_search_logs_searched_at" ON "public"."product_search_logs" USING "btree" ("searched_at");



CREATE INDEX "idx_store_knowledge_store_id" ON "public"."store_knowledge" USING "btree" ("store_id");



CREATE INDEX "idx_vcs_coupon_type_id" ON "public"."vendor_coupon_settings" USING "btree" ("coupon_type_id");



CREATE INDEX "idx_vcs_participating" ON "public"."vendor_coupon_settings" USING "btree" ("coupon_type_id", "is_participating") WHERE ("is_participating" = true);



CREATE INDEX "idx_vcs_vendor_id" ON "public"."vendor_coupon_settings" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_embeddings_embedding" ON "public"."vendor_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_vendor_embeddings_store_number" ON "public"."vendor_embeddings" USING "btree" ("store_number");



CREATE INDEX "knowledge_embeddings_embedding_idx" ON "public"."knowledge_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "kotodutes_created_at_idx" ON "public"."kotodutes" USING "btree" ("created_at" DESC);



CREATE INDEX "kotodutes_report_count_idx" ON "public"."kotodutes" USING "btree" ("report_count" DESC);



CREATE INDEX "kotodutes_status_idx" ON "public"."kotodutes" USING "btree" ("status");



CREATE INDEX "kotodutes_vendor_id_idx" ON "public"."kotodutes" USING "btree" ("vendor_id");



CREATE INDEX "location_assignments_market_date_idx" ON "public"."location_assignments" USING "btree" ("market_date");



CREATE INDEX "location_assignments_vendor_id_idx" ON "public"."location_assignments" USING "btree" ("vendor_id");



CREATE INDEX "map_layout_snapshots_created_at_idx" ON "public"."map_layout_snapshots" USING "btree" ("created_at" DESC);



CREATE INDEX "map_route_points_branch_from_id_idx" ON "public"."map_route_points" USING "btree" ("branch_from_id");



CREATE INDEX "map_route_points_sort_order_idx" ON "public"."map_route_points" USING "btree" ("sort_order");



CREATE INDEX "shop_page_views_vendor_id_idx" ON "public"."shop_page_views" USING "btree" ("vendor_id");



CREATE INDEX "shop_page_views_viewed_at_idx" ON "public"."shop_page_views" USING "btree" ("viewed_at");



CREATE UNIQUE INDEX "uq_coupon_issuances_initial" ON "public"."coupon_issuances" USING "btree" ("visitor_key", "market_date") WHERE ("issue_reason" = 'initial'::"text");



CREATE INDEX "vendor_contents_expires_at_idx" ON "public"."vendor_contents" USING "btree" ("expires_at");



CREATE INDEX "vendor_contents_status_idx" ON "public"."vendor_contents" USING "btree" ("status");



CREATE INDEX "vendor_contents_vendor_id_idx" ON "public"."vendor_contents" USING "btree" ("vendor_id");



CREATE INDEX "vendors_category_id_idx" ON "public"."vendors" USING "btree" ("category_id");



CREATE INDEX "vendors_role_idx" ON "public"."vendors" USING "btree" ("role");



CREATE INDEX "web_page_analytics_path_idx" ON "public"."web_page_analytics" USING "btree" ("path");



CREATE INDEX "web_page_analytics_role_idx" ON "public"."web_page_analytics" USING "btree" ("user_role");



CREATE INDEX "web_page_analytics_visit_date_idx" ON "public"."web_page_analytics" USING "btree" ("visit_date" DESC);



CREATE OR REPLACE TRIGGER "kotodutes_report_notify_trigger" AFTER UPDATE ON "public"."kotodutes" FOR EACH ROW EXECUTE FUNCTION "public"."notify_kotodute_reported"();



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."coupon_issuances"
    ADD CONSTRAINT "coupon_issuances_coupon_type_id_fkey" FOREIGN KEY ("coupon_type_id") REFERENCES "public"."coupon_types"("id");



ALTER TABLE ONLY "public"."coupon_issuances"
    ADD CONSTRAINT "coupon_issuances_used_vendor_id_fkey" FOREIGN KEY ("used_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."vendors"("id");



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_coupon_issuance_id_fkey" FOREIGN KEY ("coupon_issuance_id") REFERENCES "public"."coupon_issuances"("id");



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_coupon_type_id_fkey" FOREIGN KEY ("coupon_type_id") REFERENCES "public"."coupon_types"("id");



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_next_coupon_type_id_fkey" FOREIGN KEY ("next_coupon_type_id") REFERENCES "public"."coupon_types"("id");



ALTER TABLE ONLY "public"."coupon_redemption_logs"
    ADD CONSTRAINT "coupon_redemption_logs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id");



ALTER TABLE ONLY "public"."coupon_stamps"
    ADD CONSTRAINT "coupon_stamps_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kotodutes"
    ADD CONSTRAINT "kotodutes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."location_assignments"
    ADD CONSTRAINT "location_assignments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."market_locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_assignments"
    ADD CONSTRAINT "location_assignments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."map_route_points"
    ADD CONSTRAINT "map_route_points_branch_from_id_fkey" FOREIGN KEY ("branch_from_id") REFERENCES "public"."map_route_points"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_sales"
    ADD CONSTRAINT "product_sales_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_seasons"
    ADD CONSTRAINT "product_seasons_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_attendance_vendor"
    ADD CONSTRAINT "shop_attendance_vendor_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_attendance_votes"
    ADD CONSTRAINT "shop_attendance_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_page_views"
    ADD CONSTRAINT "shop_page_views_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_knowledge"
    ADD CONSTRAINT "store_knowledge_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_contents"
    ADD CONSTRAINT "vendor_contents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."vendor_contents"
    ADD CONSTRAINT "vendor_contents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_coupon_settings"
    ADD CONSTRAINT "vendor_coupon_settings_coupon_type_id_fkey" FOREIGN KEY ("coupon_type_id") REFERENCES "public"."coupon_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_coupon_settings"
    ADD CONSTRAINT "vendor_coupon_settings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_embeddings"
    ADD CONSTRAINT "vendor_embeddings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable read access for all users" ON "public"."todos" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "admin manage map landmarks" ON "public"."map_landmarks" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = 'admin'::"text")))));



CREATE POLICY "admin manage market locations" ON "public"."market_locations" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins insert map layout snapshots" ON "public"."map_layout_snapshots" FOR INSERT WITH CHECK ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admins manage system settings" ON "public"."system_settings" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admins manage web visitor daily uniques" ON "public"."web_visitor_daily_uniques" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = 'admin'::"text")))));



CREATE POLICY "admins manage web visitor stats" ON "public"."web_visitor_stats" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = 'admin'::"text")))));



CREATE POLICY "admins read map layout snapshots" ON "public"."map_layout_snapshots" FOR SELECT USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admins read page analytics" ON "public"."web_page_analytics" FOR SELECT USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admins read system settings" ON "public"."system_settings" FOR SELECT USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admins read web visitor daily uniques" ON "public"."web_visitor_daily_uniques" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."ai_abuse_blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_abuse_blocks_select_admin" ON "public"."ai_abuse_blocks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'moderator'::"text"]))))));



ALTER TABLE "public"."ai_abuse_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_abuse_events_select_admin" ON "public"."ai_abuse_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'moderator'::"text"]))))));



ALTER TABLE "public"."ai_consult_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone can insert page views" ON "public"."shop_page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "anyone can insert search logs" ON "public"."product_search_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "audit_logs_select_admin" ON "public"."admin_audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "authenticated users can read search logs" ON "public"."product_search_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_issuances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_redemption_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_stamps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupon_types_admin_all" ON "public"."coupon_types" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "coupon_types_public_select" ON "public"."coupon_types" FOR SELECT USING (true);



CREATE POLICY "crl_admin_select" ON "public"."coupon_redemption_logs" FOR SELECT USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



ALTER TABLE "public"."knowledge_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kotodutes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kotodutes_insert_all" ON "public"."kotodutes" FOR INSERT WITH CHECK (true);



CREATE POLICY "kotodutes_select_admin" ON "public"."kotodutes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "kotodutes_select_published" ON "public"."kotodutes" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "kotodutes_update_admin" ON "public"."kotodutes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "auth"."uid"()) AND ("vendors"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'moderator'::"text"]))))));



ALTER TABLE "public"."location_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."map_landmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."map_layout_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."map_route_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."map_route_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_search_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public can read active contents" ON "public"."vendor_contents" FOR SELECT USING ((("expires_at" > "now"()) AND ("status" = 'active'::"text")));



CREATE POLICY "public can read product_sales" ON "public"."product_sales" FOR SELECT USING (true);



CREATE POLICY "public can read products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "public insert page analytics" ON "public"."web_page_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "public read assignments" ON "public"."location_assignments" FOR SELECT USING (true);



CREATE POLICY "public read map landmarks" ON "public"."map_landmarks" FOR SELECT USING (true);



CREATE POLICY "public read map_route_configs" ON "public"."map_route_configs" FOR SELECT USING (true);



CREATE POLICY "public read map_route_points" ON "public"."map_route_points" FOR SELECT USING (true);



CREATE POLICY "public read market locations" ON "public"."market_locations" FOR SELECT USING (true);



CREATE POLICY "public read product_seasons" ON "public"."product_seasons" FOR SELECT USING (true);



CREATE POLICY "public read seasons" ON "public"."seasons" FOR SELECT USING (true);



CREATE POLICY "public read vendors" ON "public"."vendors" FOR SELECT USING (true);



CREATE POLICY "public read web visitor stats" ON "public"."web_visitor_stats" FOR SELECT USING (true);



ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_attendance_vendor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_attendance_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shops_import" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shops_name_staging" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shops_strong" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shops_topic_import" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_knowledge" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vcs_public_select" ON "public"."vendor_coupon_settings" FOR SELECT USING (true);



CREATE POLICY "vcs_vendor_delete" ON "public"."vendor_coupon_settings" FOR DELETE USING (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vcs_vendor_insert" ON "public"."vendor_coupon_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vcs_vendor_update" ON "public"."vendor_coupon_settings" FOR UPDATE USING (("auth"."uid"() = "vendor_id")) WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendor insert self" ON "public"."vendors" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "vendor update self" ON "public"."vendors" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."vendor_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_coupon_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_embeddings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendor_insert_self" ON "public"."shop_attendance_vendor" FOR INSERT WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendor_select_all" ON "public"."shop_attendance_vendor" FOR SELECT USING (true);



ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendors can delete own contents" ON "public"."vendor_contents" FOR DELETE USING (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors can insert own contents" ON "public"."vendor_contents" FOR INSERT WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors can manage own product_sales" ON "public"."product_sales" USING (("auth"."uid"() = "vendor_id")) WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors can read own contents" ON "public"."vendor_contents" FOR SELECT USING (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors can read own page views" ON "public"."shop_page_views" FOR SELECT USING (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors can read own store logs" ON "public"."ai_consult_logs" FOR SELECT USING (("store_id" = ("auth"."uid"())::"text"));



CREATE POLICY "vendors can update own contents" ON "public"."vendor_contents" FOR UPDATE USING (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors manage own assignments" ON "public"."location_assignments" USING (("auth"."uid"() = "vendor_id")) WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "vendors manage own knowledge" ON "public"."store_knowledge" USING (("auth"."uid"() = "store_id")) WITH CHECK (("auth"."uid"() = "store_id"));



CREATE POLICY "vendors manage own products" ON "public"."products" USING (("auth"."uid"() = "vendor_id")) WITH CHECK (("auth"."uid"() = "vendor_id"));



CREATE POLICY "votes_insert_self" ON "public"."shop_attendance_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "votes_select_all" ON "public"."shop_attendance_votes" FOR SELECT USING (true);



ALTER TABLE "public"."web_page_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_visitor_daily_uniques" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_visitor_stats" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shop_attendance_estimates"("target_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_attendance_estimates"("target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_attendance_estimates"("target_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_knowledge_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_knowledge_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_knowledge_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_store_knowledge"("query_embedding" "public"."vector", "target_store_id" "text", "match_count" integer, "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_store_knowledge"("query_embedding" "public"."vector", "target_store_id" "text", "match_count" integer, "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_store_knowledge"("query_embedding" "public"."vector", "target_store_id" "text", "match_count" integer, "match_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_vendor_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_vendor_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_vendor_embeddings"("query_embedding" "public"."vector", "match_count" integer, "match_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_kotodute_reported"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_kotodute_reported"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_kotodute_reported"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."track_home_visit"("p_visit_date" "date", "p_visitor_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_home_visit"("p_visit_date" "date", "p_visitor_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_home_visit"("p_visit_date" "date", "p_visitor_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."admin_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_abuse_blocks" TO "anon";
GRANT ALL ON TABLE "public"."ai_abuse_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_abuse_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."ai_abuse_events" TO "anon";
GRANT ALL ON TABLE "public"."ai_abuse_events" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_abuse_events" TO "service_role";



GRANT ALL ON TABLE "public"."ai_consult_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_consult_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_consult_logs" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_issuances" TO "anon";
GRANT ALL ON TABLE "public"."coupon_issuances" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_issuances" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_redemption_logs" TO "anon";
GRANT ALL ON TABLE "public"."coupon_redemption_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_redemption_logs" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_stamps" TO "anon";
GRANT ALL ON TABLE "public"."coupon_stamps" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_stamps" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_types" TO "anon";
GRANT ALL ON TABLE "public"."coupon_types" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_types" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."kotodutes" TO "anon";
GRANT ALL ON TABLE "public"."kotodutes" TO "authenticated";
GRANT ALL ON TABLE "public"."kotodutes" TO "service_role";



GRANT ALL ON TABLE "public"."location_assignments" TO "anon";
GRANT ALL ON TABLE "public"."location_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."location_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."map_landmarks" TO "anon";
GRANT ALL ON TABLE "public"."map_landmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."map_landmarks" TO "service_role";



GRANT ALL ON TABLE "public"."map_layout_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."map_layout_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."map_layout_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."map_route_configs" TO "anon";
GRANT ALL ON TABLE "public"."map_route_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."map_route_configs" TO "service_role";



GRANT ALL ON TABLE "public"."map_route_points" TO "anon";
GRANT ALL ON TABLE "public"."map_route_points" TO "authenticated";
GRANT ALL ON TABLE "public"."map_route_points" TO "service_role";



GRANT ALL ON TABLE "public"."market_locations" TO "anon";
GRANT ALL ON TABLE "public"."market_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."market_locations" TO "service_role";



GRANT ALL ON TABLE "public"."product_sales" TO "anon";
GRANT ALL ON TABLE "public"."product_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."product_sales" TO "service_role";



GRANT ALL ON TABLE "public"."product_search_logs" TO "anon";
GRANT ALL ON TABLE "public"."product_search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."product_search_logs" TO "service_role";



GRANT ALL ON TABLE "public"."product_seasons" TO "anon";
GRANT ALL ON TABLE "public"."product_seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."product_seasons" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."shop_attendance_vendor" TO "anon";
GRANT ALL ON TABLE "public"."shop_attendance_vendor" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_attendance_vendor" TO "service_role";



GRANT ALL ON TABLE "public"."shop_attendance_votes" TO "anon";
GRANT ALL ON TABLE "public"."shop_attendance_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_attendance_votes" TO "service_role";



GRANT ALL ON TABLE "public"."shop_page_views" TO "anon";
GRANT ALL ON TABLE "public"."shop_page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_page_views" TO "service_role";



GRANT ALL ON TABLE "public"."shops_import" TO "anon";
GRANT ALL ON TABLE "public"."shops_import" TO "authenticated";
GRANT ALL ON TABLE "public"."shops_import" TO "service_role";



GRANT ALL ON TABLE "public"."shops_name_staging" TO "anon";
GRANT ALL ON TABLE "public"."shops_name_staging" TO "authenticated";
GRANT ALL ON TABLE "public"."shops_name_staging" TO "service_role";



GRANT ALL ON TABLE "public"."shops_strong" TO "anon";
GRANT ALL ON TABLE "public"."shops_strong" TO "authenticated";
GRANT ALL ON TABLE "public"."shops_strong" TO "service_role";



GRANT ALL ON TABLE "public"."shops_topic_import" TO "anon";
GRANT ALL ON TABLE "public"."shops_topic_import" TO "authenticated";
GRANT ALL ON TABLE "public"."shops_topic_import" TO "service_role";



GRANT ALL ON TABLE "public"."store_knowledge" TO "anon";
GRANT ALL ON TABLE "public"."store_knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."store_knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_contents" TO "anon";
GRANT ALL ON TABLE "public"."vendor_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_contents" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_coupon_settings" TO "anon";
GRANT ALL ON TABLE "public"."vendor_coupon_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_coupon_settings" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."vendor_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."web_page_analytics" TO "anon";
GRANT ALL ON TABLE "public"."web_page_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."web_page_analytics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."web_page_analytics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."web_page_analytics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."web_page_analytics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."web_visitor_daily_uniques" TO "anon";
GRANT ALL ON TABLE "public"."web_visitor_daily_uniques" TO "authenticated";
GRANT ALL ON TABLE "public"."web_visitor_daily_uniques" TO "service_role";



GRANT ALL ON TABLE "public"."web_visitor_stats" TO "anon";
GRANT ALL ON TABLE "public"."web_visitor_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."web_visitor_stats" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































