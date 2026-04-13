// Supabase Edge Function: delete-family-photos
// Deletes all photos under <familyId>/ in bucket baby-photos.
// Uses service role for Storage operations, but authorizes the caller via JWT:
// caller must be authenticated AND be a member of the family.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function listAllFiles(supabase: any, bucket: string, prefix: string) {
  // Flat structure: files are stored as `${familyId}/${timestamp}.ext`
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  const files = (data || []).filter((x: any) => x && x.name && !x.id?.endsWith?.("/"));
  return files.map((f: any) => `${prefix}/${f.name}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Missing Supabase env" }, 500);

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!jwt) return json({ error: "Missing Authorization Bearer token" }, 401);

  const body = await req.json().catch(() => null) as { familyId?: string } | null;
  const familyId = body?.familyId;
  if (!familyId) return json({ error: "Missing familyId" }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Validate JWT and get user
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  // Verify membership (server-side)
  const { data: member, error: memErr } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memErr) return json({ error: memErr.message }, 500);
  if (!member) return json({ error: "Forbidden" }, 403);

  const bucket = "baby-photos";
  try {
    const paths = await listAllFiles(supabase, bucket, familyId);
    if (!paths.length) return json({ ok: true, deleted: 0 });
    const { error: delErr } = await supabase.storage.from(bucket).remove(paths);
    if (delErr) return json({ error: delErr.message }, 500);
    return json({ ok: true, deleted: paths.length });
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "Unknown error";
    return json({ error: msg }, 500);
  }
});

