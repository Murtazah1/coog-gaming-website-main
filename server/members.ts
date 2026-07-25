"user server"

import { db } from "@/db/index";
import { members, type Members } from "@/db/schema/members";
import { createAdminClient } from "@/lib/supabase/admin";
import { eq, ilike } from "drizzle-orm";