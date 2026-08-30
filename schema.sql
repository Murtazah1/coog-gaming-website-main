


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    gamer_name
  )
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'gamer_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."address" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "line1" "text" NOT NULL,
    "line2" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "country" "text" NOT NULL,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."address" OWNER TO "postgres";


COMMENT ON TABLE "public"."address" IS 'Addresses that users can store';



CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "role" smallint NOT NULL
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


COMMENT ON COLUMN "public"."admins"."role" IS 'role of admins in the org mapping go like this, 0: President, 1: VP, 2: Treasurer, 3: Secretary, 4: Esports Director, 5: Board Game Manager, 6: Tabletop Manager, 7: TCG Manager, 8: Event Manager, 9: Sponsorship Manager';



CREATE TABLE IF NOT EXISTS "public"."check_ins" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "location" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "created_by" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "image_url" "text"
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL,
    "current_period_end" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "members_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['semester'::"text", 'year'::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "game_id" "uuid" NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "gamer_name" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."address"
    ADD CONSTRAINT "addreses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "member_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admins_member_id" ON "public"."admins" USING "btree" ("member_id");



CREATE INDEX "idx_check_ins_event_id" ON "public"."check_ins" USING "btree" ("event_id");



CREATE INDEX "idx_check_ins_user_id" ON "public"."check_ins" USING "btree" ("user_id");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_members_user_id" ON "public"."members" USING "btree" ("user_id");



CREATE INDEX "idx_team_members_member_id" ON "public"."team_members" USING "btree" ("member_id");



CREATE INDEX "idx_teams_game_id" ON "public"."teams" USING "btree" ("game_id");



CREATE INDEX "members_current_period_end_idx" ON "public"."members" USING "btree" ("current_period_end");



ALTER TABLE ONLY "public"."address"
    ADD CONSTRAINT "addreses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."members"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Anyone can read admins" ON "public"."admins" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read events" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read games" ON "public"."games" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read team_members" ON "public"."team_members" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read teams" ON "public"."teams" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Members can read own membership" ON "public"."members" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")));



CREATE POLICY "Users and admins can read check_ins" ON "public"."check_ins" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")));



CREATE POLICY "Users can read own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "private"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")));



ALTER TABLE "public"."address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."address" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "service_role";
GRANT SELECT ON TABLE "public"."admins" TO "anon";
GRANT SELECT ON TABLE "public"."admins" TO "authenticated";



GRANT ALL ON TABLE "public"."check_ins" TO "service_role";
GRANT SELECT ON TABLE "public"."check_ins" TO "authenticated";



GRANT ALL ON TABLE "public"."events" TO "service_role";
GRANT SELECT ON TABLE "public"."events" TO "anon";
GRANT SELECT ON TABLE "public"."events" TO "authenticated";



GRANT ALL ON TABLE "public"."games" TO "service_role";
GRANT SELECT ON TABLE "public"."games" TO "anon";
GRANT SELECT ON TABLE "public"."games" TO "authenticated";



GRANT ALL ON TABLE "public"."members" TO "service_role";
GRANT SELECT ON TABLE "public"."members" TO "authenticated";



GRANT ALL ON TABLE "public"."team_members" TO "service_role";
GRANT SELECT ON TABLE "public"."team_members" TO "anon";
GRANT SELECT ON TABLE "public"."team_members" TO "authenticated";



GRANT ALL ON TABLE "public"."teams" TO "service_role";
GRANT SELECT ON TABLE "public"."teams" TO "anon";
GRANT SELECT ON TABLE "public"."teams" TO "authenticated";



GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "authenticated";



GRANT UPDATE("first_name") ON TABLE "public"."users" TO "authenticated";



GRANT UPDATE("last_name") ON TABLE "public"."users" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."users" TO "authenticated";



GRANT UPDATE("gamer_name") ON TABLE "public"."users" TO "authenticated";



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







