// Supabase Edge Function: cron-notifications
// Intended to run on a schedule (e.g. every 5 minutes).
// Computes "due" BabyCare reminders and sends Web Push notifications.
//
// Env required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT
//
// Notes:
// - This is an MVP scheduler. It sends to all family members who have push subscriptions.
// - Dedupe is handled via push_sent.dedupe_key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseTimeToDate(base: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function withinWindow(t: Date, from: Date, to: Date) {
  return t.getTime() >= from.getTime() && t.getTime() < to.getTime();
}

Deno.serve(async (req) => {
  // If CRON_SECRET is set, require it (for external schedulers)
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (CRON_SECRET) {
    const provided = req.headers.get("x-cron-secret") || "";
    if (provided !== CRON_SECRET) return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Missing Supabase env" }, 500);
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: "Missing VAPID env" }, 500);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const windowFrom = new Date(now.getTime() - 60 * 1000); // allow small drift
  const windowTo = new Date(now.getTime() + 5 * 60 * 1000);

  // Fetch babies with their family + relevant fields
  const { data: babies, error: babiesErr } = await supabase
    .from("babies")
    .select("id,family_id,name,feeds_per_day,weight,birth_date")
    .limit(2000);

  if (babiesErr) return json({ error: babiesErr.message }, 500);
  if (!babies?.length) return json({ ok: true, checkedBabies: 0, sent: 0 });

  // Map family -> members
  const familyIds = [...new Set(babies.map((b) => b.family_id).filter(Boolean))];
  const { data: members, error: memErr } = await supabase
    .from("family_members")
    .select("family_id,user_id")
    .in("family_id", familyIds);
  if (memErr) return json({ error: memErr.message }, 500);

  const familyToUsers = new Map<string, string[]>();
  for (const m of members || []) {
    const arr = familyToUsers.get(m.family_id) || [];
    arr.push(m.user_id);
    familyToUsers.set(m.family_id, arr);
  }

  // Preload notification prefs per user (optional)
  const allUserIds = [...new Set((members || []).map((m) => m.user_id))];
  const { data: prefsRows } = await supabase
    .from("user_settings")
    .select("user_id,key,value")
    .in("user_id", allUserIds)
    .eq("key", "notif_prefs");
  const prefsByUser = new Map<string, any>();
  for (const r of prefsRows || []) prefsByUser.set(r.user_id, r.value || {});

  // Preload push subscriptions per user
  const { data: subsRows, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth")
    .in("user_id", allUserIds);
  if (subsErr) return json({ error: subsErr.message }, 500);
  const subsByUser = new Map<string, any[]>();
  for (const s of subsRows || []) {
    const arr = subsByUser.get(s.user_id) || [];
    arr.push(s);
    subsByUser.set(s.user_id, arr);
  }

  // Pull today's logs for these babies (feed/temperature/fever_med are in baby_log)
  const todayKey = toDateKey(now);
  const babyIds = babies.map((b) => b.id);
  const { data: logs, error: logsErr } = await supabase
    .from("baby_log")
    .select("id,family_id,baby_id,type,date,time,amount,food_type,temperature,medicine")
    .in("baby_id", babyIds)
    .eq("date", todayKey)
    .limit(10000);
  if (logsErr) return json({ error: logsErr.message }, 500);

  const logsByBaby = new Map<string, any[]>();
  for (const l of logs || []) {
    const arr = logsByBaby.get(l.baby_id) || [];
    arr.push(l);
    logsByBaby.set(l.baby_id, arr);
  }

  // Pull meds table for these babies (scheduled meds)
  const { data: meds, error: medsErr } = await supabase
    .from("meds")
    .select("id,family_id,baby_id,name,dose,instructions,times,time_hours")
    .in("baby_id", babyIds)
    .limit(5000);
  if (medsErr) return json({ error: medsErr.message }, 500);

  const medsByBaby = new Map<string, any[]>();
  for (const m of meds || []) {
    const arr = medsByBaby.get(m.baby_id) || [];
    arr.push(m);
    medsByBaby.set(m.baby_id, arr);
  }

  // Pull vaccinations (today + tomorrow) for these babies
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const { data: vax, error: vaxErr } = await supabase
    .from("vaccinations")
    .select("id,family_id,baby_id,name,age_label,scheduled_date,status")
    .in("baby_id", babyIds)
    .in("scheduled_date", [todayKey, tomorrowKey])
    .eq("status", "pending")
    .limit(10000);
  if (vaxErr) return json({ error: vaxErr.message }, 500);

  const vaxByBaby = new Map<string, any[]>();
  for (const r of vax || []) {
    const arr = vaxByBaby.get(r.baby_id) || [];
    arr.push(r);
    vaxByBaby.set(r.baby_id, arr);
  }

  let sent = 0;
  let deduped = 0;
  const deadEndpoints: string[] = [];

  async function sendToUser(userId: string, payload: any) {
    const subs = subsByUser.get(userId) || [];
    if (!subs.length) return;

    const prefs = { feeding: true, meds: true, vaccines: true, temp: true, fever_med: true, ...(prefsByUser.get(userId) || {}) };
    if (payload.kind && prefs[payload.kind] === false) return;

    const dedupe_key = payload.dedupe_key;
    const { error: insErr } = await supabase
      .from("push_sent")
      .insert({
        user_id: userId,
        family_id: payload.family_id,
        baby_id: payload.baby_id,
        kind: payload.kind || "generic",
        scheduled_at: payload.scheduled_at,
        dedupe_key,
      });

    if (insErr) {
      // unique violation => already sent
      deduped++;
      return;
    }

    const wpPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
      url: payload.url || "/",
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            wpPayload,
          );
          sent++;
        } catch (e) {
          const msg = String((e as any)?.statusCode || "") + " " + String((e as any)?.body || (e as any)?.message || "");
          if (msg.includes("410") || msg.includes("404")) deadEndpoints.push(s.endpoint);
        }
      }),
    );
  }

  for (const baby of babies) {
    const familyUsers = familyToUsers.get(baby.family_id) || [];
    if (!familyUsers.length) continue;
    const babyName = baby.name || "התינוק";

    // Feeding reminder (next feed based on last feed + interval)
    const babyLogs = logsByBaby.get(baby.id) || [];
    const feeds = babyLogs.filter((l) => l.type === "feed" && typeof l.time === "string" && l.time.includes(":"));
    if (feeds.length) {
      const feedsPerDay = baby.feeds_per_day || 8;
      const intervalMin = Math.round((24 * 60) / feedsPerDay);
      feeds.sort((a, b) => (a.time > b.time ? 1 : -1));
      const last = feeds[feeds.length - 1];
      const lastTime = parseTimeToDate(now, last.time);
      const next = new Date(lastTime);
      next.setMinutes(next.getMinutes() + intervalMin);
      if (next.getDate() !== now.getDate()) {
        // next day reminder should be handled by tomorrow run
      } else if (withinWindow(next, windowFrom, windowTo)) {
        const scheduled_at = next.toISOString();
        const dedupe_key = `feed:${baby.id}:${scheduled_at}`;
        const payload = {
          family_id: baby.family_id,
          baby_id: baby.id,
          kind: "feeding",
          scheduled_at,
          dedupe_key,
          title: `🍼 הגיע זמן האכלה — ${babyName}`,
          body: `מומלץ לתעד האכלה עכשיו (מרווח לפי ${feedsPerDay} האכלות/יום)`,
          tag: `feed-${baby.id}`,
          url: "/",
        };
        for (const uid of familyUsers) await sendToUser(uid, payload);
      }
    }

    // Scheduled meds reminders (today occurrences only)
    const babyMeds = medsByBaby.get(baby.id) || [];
    const defaultHours: Record<string, string> = { "בוקר": "08:00", "צהריים": "13:00", "ערב": "19:00", "לילה": "22:00" };
    for (const med of babyMeds) {
      const times: string[] = Array.isArray(med.times) ? med.times : [];
      for (const timeName of times) {
        const timeStr = med.time_hours?.[timeName] || defaultHours[timeName];
        if (!timeStr) continue;
        const t = parseTimeToDate(now, timeStr);
        if (withinWindow(t, windowFrom, windowTo)) {
          const scheduled_at = t.toISOString();
          const dedupe_key = `med:${med.id}:${timeName}:${scheduled_at}`;
          const payload = {
            family_id: baby.family_id,
            baby_id: baby.id,
            kind: "meds",
            scheduled_at,
            dedupe_key,
            title: `💊 זמן תרופה — ${babyName}`,
            body: `${med.name}${med.dose ? " · " + med.dose : ""}${med.instructions ? " · " + med.instructions : ""}`,
            tag: `med-${med.id}-${timeName}`,
            url: "/",
          };
          for (const uid of familyUsers) await sendToUser(uid, payload);
        }
      }
    }

    // Vaccination reminders at 09:00 (today + tomorrow)
    const babyVax = vaxByBaby.get(baby.id) || [];
    for (const v of babyVax) {
      const d = parseTimeToDate(new Date(v.scheduled_date), "09:00");
      if (withinWindow(d, windowFrom, windowTo)) {
        const isTomorrow = v.scheduled_date === tomorrowKey;
        const scheduled_at = d.toISOString();
        const dedupe_key = `vax:${v.id}:${scheduled_at}`;
        const payload = {
          family_id: baby.family_id,
          baby_id: baby.id,
          kind: "vaccines",
          scheduled_at,
          dedupe_key,
          title: isTomorrow ? `💉 חיסון מחר — ${babyName}` : `💉 חיסון היום — ${babyName}`,
          body: `${v.name} (${v.age_label || ""})`,
          tag: `vax-${v.id}`,
          url: "/",
        };
        for (const uid of familyUsers) await sendToUser(uid, payload);
      }
    }
  }

  if (deadEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  return json({
    ok: true,
    checkedBabies: babies.length,
    sent,
    deduped,
    pruned: deadEndpoints.length,
    windowFrom: windowFrom.toISOString(),
    windowTo: windowTo.toISOString(),
  });
});

