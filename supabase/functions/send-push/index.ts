// Supabase Edge Function: send-push
// Sends a Web Push message to all subscriptions of a user.
// Requires env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (e.g. "mailto:you@example.com")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

type Payload = {
  user_id: string;
  title: string;
  body: string;
  tag?: string;
  url?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Missing Supabase env" }, 500);
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: "Missing VAPID env" }, 500);

  const body = (await req.json().catch(() => null)) as Payload | null;
  if (!body?.user_id || !body?.title || !body?.body) return json({ error: "Missing fields" }, 400);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", body.user_id);

  if (error) return json({ error: error.message }, 500);
  if (!subs?.length) return json({ ok: true, sent: 0 });

  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    tag: body.tag,
    url: body.url,
  });

  let sent = 0;
  const deadEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
        );
        sent++;
      } catch (e) {
        // 410/404 => subscription no longer valid
        const msg = String((e as any)?.statusCode || "") + " " + String((e as any)?.body || (e as any)?.message || "");
        if (msg.includes("410") || msg.includes("404")) deadEndpoints.push(s.endpoint);
      }
    }),
  );

  if (deadEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  return json({ ok: true, sent, pruned: deadEndpoints.length });
});

