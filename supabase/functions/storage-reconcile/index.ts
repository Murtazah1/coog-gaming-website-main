import { createClient } from "npm:@supabase/supabase-js@2";

type CleanupItem = {
  id: string;
  bucket_id: "avatars" | "game-images";
  object_name: string;
  reason: string;
  attempts: number;
};

const jsonHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("STORAGE_RECONCILE_SECRET");
  const suppliedSecret = request.headers.get("x-storage-cleanup-secret");

  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Storage worker is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: refreshError } = await supabase.rpc(
    "refresh_storage_cleanup_candidates",
    { orphan_grace: "24 hours" },
  );

  if (refreshError) {
    return jsonResponse({ error: refreshError.message }, 500);
  }

  const { data, error: claimError } = await supabase.rpc(
    "claim_storage_cleanup_batch",
    { requested_limit: 50 },
  );

  if (claimError) {
    return jsonResponse({ error: claimError.message }, 500);
  }

  const items = (data ?? []) as CleanupItem[];
  const results = { claimed: items.length, deleted: 0, cancelled: 0, retried: 0 };

  for (const item of items) {
    const { data: isReferenced, error: referenceError } = await supabase.rpc(
      "storage_image_is_referenced",
      {
        requested_bucket: item.bucket_id,
        requested_object_name: item.object_name,
      },
    );

    if (referenceError) {
      await supabase.rpc("resolve_storage_cleanup", {
        requested_id: item.id,
        outcome: "retry",
        error_message: referenceError.message,
      });
      results.retried += 1;
      continue;
    }

    if (isReferenced) {
      await supabase.rpc("resolve_storage_cleanup", {
        requested_id: item.id,
        outcome: "cancelled",
        error_message: "Object became referenced before deletion.",
      });
      results.cancelled += 1;
      continue;
    }

    const { error: deleteError } = await supabase.storage
      .from(item.bucket_id)
      .remove([item.object_name]);

    if (deleteError) {
      await supabase.rpc("resolve_storage_cleanup", {
        requested_id: item.id,
        outcome: "retry",
        error_message: deleteError.message,
      });
      results.retried += 1;
      continue;
    }

    await supabase.rpc("resolve_storage_cleanup", {
      requested_id: item.id,
      outcome: "deleted",
      error_message: null,
    });
    results.deleted += 1;
  }

  return jsonResponse(results);
});
