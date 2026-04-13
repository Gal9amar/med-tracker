import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((ch) => ch.charCodeAt(0)))
}

export function canWebPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function ensurePushSubscription({ user, userAgent } = {}) {
  if (!user?.id) return { error: { message: 'Missing user' } }
  if (!canWebPush()) return { error: { message: 'Web Push not supported on this device/browser' } }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    return { error: { message: 'Missing VITE_VAPID_PUBLIC_KEY' } }
  }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  const json = sub.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh || null
  const auth = json.keys?.auth || null

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent || navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )

  if (error) return { error }
  return { data: { endpoint } }
}

export async function removePushSubscription() {
  if (!canWebPush()) return { data: null }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { data: null }

  const endpoint = sub.endpoint
  try {
    await sub.unsubscribe()
  } catch {
    // ignore
  }
  // Best-effort delete; relies on RLS allowing user delete own rows by endpoint.
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return { data: { endpoint } }
}

