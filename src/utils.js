export const TIMES = ['בוקר', 'צהריים', 'ערב', 'לילה']
export const TIME_ICONS = { 'בוקר': '🌅', 'צהריים': '☀️', 'ערב': '🌆', 'לילה': '🌙' }
export const TIME_COLORS = { 'בוקר': '#f59e0b', 'צהריים': '#10b981', 'ערב': '#6366f1', 'לילה': '#8b5cf6' }
export const MED_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#ec4899','#14b8a6']
export const PROFILE_AVATARS = ['👤','👨','👩','👦','👧','👴','👵','🧑']
export const INSTRUCTIONS = [
  'עם אוכל', 'בצום', 'שעה לפני האוכל', 'לא לשבור', 'לא ללעוס',
  'עם מים בלבד', 'להניח מתחת ללשון', 'לפני שינה', 'אחרי אוכל'
]
export const STORAGE_KEY = 'medtracker_v2'

export function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (d) return {
      babyLog: [],
      prescriptions: [],
      ...d
    }
    const old = JSON.parse(localStorage.getItem('medtracker_v1'))
    if (old) {
      return {
        profiles: [{ id: 'default', name: 'אני', avatar: '👤' }],
        activeProfile: 'default',
        meds: (old.meds || []).map(m => ({ ...m, profileId: 'default' })),
        log: (old.log || []).map(l => ({ ...l, profileId: 'default' })),
        inventory: old.inventory || [],
        babyLog: [],
        prescriptions: []
      }
    }
    return defaultData()
  } catch { return defaultData() }
}

function defaultData() {
  return {
    profiles: [{ id: 'default', name: 'אני', avatar: '👤' }],
    activeProfile: 'default',
    meds: [], log: [], inventory: [], babyLog: [], prescriptions: []
  }
}

export function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }
export function uid() { return Math.random().toString(36).slice(2, 9) }
export function todayKey() { return new Date().toISOString().slice(0, 10) }

export function daysUntilExpiry(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
export function expiryColor(days) {
  if (days === null) return '#6b7280'
  if (days < 0) return '#ef4444'
  if (days <= 30) return '#f59e0b'
  return '#22c55e'
}
export function expiryLabel(days) {
  if (days === null) return '—'
  if (days < 0) return 'פג תוקף!'
  if (days === 0) return 'פג היום!'
  if (days <= 30) return `${days} ימים`
  return 'תקין'
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export function scheduleDailyReminders(meds, profileName) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const defaultHours = { 'בוקר': '08:00', 'צהריים': '13:00', 'ערב': '19:00', 'לילה': '22:00' }
  const now = new Date()

  meds.forEach(med => {
    med.times?.forEach(time => {
      // Use custom hour if set, else fallback to default
      const hourStr = med.timeHours?.[time] || defaultHours[time]
      if (!hourStr) return
      const [h, m] = hourStr.split(':').map(Number)
      const target = new Date()
      target.setHours(h, m, 0, 0)
      if (target <= now) return // already passed today

      const delay = target - now
      setTimeout(() => {
        new Notification(`💊 ${med.name} – ${profileName}`, {
          body: `הגיע הזמן לקחת ${med.name}${med.dose ? ' ' + med.dose : ''}${med.instructions ? ' · ' + med.instructions : ''}`,
          icon: '/pill.svg',
          tag: `${med.id}-${time}` // prevent duplicate notifications
        })
      }, delay)
    })
  })
}

export function daysUntilRenewal(dateStr, months) {
  if (!dateStr || !months) return null
  const start = new Date(dateStr)
  const renewal = new Date(start)
  renewal.setMonth(renewal.getMonth() + Number(months))
  const diff = renewal - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

