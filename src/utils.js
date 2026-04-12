export const TIMES = ['בוקר', 'צהריים', 'ערב', 'לילה']
export const TIME_ICONS = { 'בוקר': '🌅', 'צהריים': '☀️', 'ערב': '🌆', 'לילה': '🌙' }
export const TIME_COLORS = { 'בוקר': '#f59e0b', 'צהריים': '#10b981', 'ערב': '#6366f1', 'לילה': '#8b5cf6' }
export const MED_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#ec4899','#14b8a6']
export const INSTRUCTIONS = [
  'עם אוכל', 'בצום', 'שעה לפני האוכל', 'לא לשבור', 'לא ללעוס',
  'עם מים בלבד', 'להניח מתחת ללשון', 'לפני שינה', 'אחרי אוכל'
]

export const STORAGE_KEY = 'babycare_v1'

// Color theme based on baby gender
export function genderColor(gender) {
  if (gender === 'female') return '#f472b6' // pink
  if (gender === 'male')   return '#60a5fa' // blue
  return '#a78bfa'                           // purple (unknown)
}

export function genderColorLight(gender) {
  if (gender === 'female') return '#f9a8d4'
  if (gender === 'male')   return '#93c5fd'
  return '#c4b5fd'
}
export const LEGACY_KEY = 'medtracker_v2'

// ── PIN Utilities ──────────────────────────────────────────────
export async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin, hash) {
  return await hashPin(pin) === hash
}

// ── Age Utilities ──────────────────────────────────────────────
export function ageInMonths(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30.44))
}

export function ageLabel(birthDate) {
  const months = ageInMonths(birthDate)
  if (months === null) return ''
  if (months < 1) return 'פחות מחודש'
  if (months < 12) return months === 1 ? 'חודש אחד' : `${months} חודשים`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return years === 1 ? 'שנה' : `${years} שנים`
  return `${years} שנ${years > 1 ? 'ים' : 'ה'} ו-${rem} חודשים`
}

// ── Data Loading & Saving ──────────────────────────────────────
export function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (d) return { ...defaultData(), ...d }
    // Migration from medtracker_v2
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY))
    if (legacy) return migrateLegacy(legacy)
    return defaultData()
  } catch { return defaultData() }
}

function migrateLegacy(old) {
  const babyProfiles = (old.profiles || []).filter(p => {
    const cat = p.ageCategory || 'adult'
    return cat === 'baby' || cat === 'toddler'
  })
  const babies = babyProfiles.length > 0
    ? babyProfiles.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar || '👶',
        birthDate: p.birthDate || '',
        gender: 'unknown',
        weight: p.weight ? parseFloat(p.weight) : null,
        height: null,
        headCircumference: null,
        bloodType: '',
        allergies: [],
        notes: ''
      }))
    : []

  const activeBaby = babies.length > 0 ? babies[0].id : null

  return {
    ...defaultData(),
    babies,
    activeBaby,
    babyLog: (old.babyLog || []).map(l => ({ ...l, babyId: l.profileId || l.babyId })),
    meds: (old.meds || []).filter(m => babyProfiles.some(p => p.id === m.profileId))
                           .map(m => ({ ...m, babyId: m.profileId })),
    medLog: (old.log || []).map(l => ({ ...l, babyId: l.profileId })),
    prescriptions: (old.prescriptions || []).map(p => ({ ...p, babyId: p.profileId })),
    inventory: old.inventory || [],
    _migratedFrom: LEGACY_KEY
  }
}

function defaultData() {
  return {
    pinHash: null,
    babies: [],
    activeBaby: null,
    babyLog: [],
    meds: [],
    medLog: [],
    inventory: [],
    prescriptions: [],
    vaccinations: [],
    growthLog: [],
    milestones: [],
    settings: {
      reminderEnabled: false,
      defaultClinic: '',
      defaultHmo: ''
    }
  }
}

export function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }
export function uid() { return Math.random().toString(36).slice(2, 9) }
export function todayKey() { return new Date().toISOString().slice(0, 10) }

// ── Expiry Utilities ──────────────────────────────────────────
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

export function daysUntilRenewal(dateStr, months) {
  if (!dateStr || !months) return null
  const start = new Date(dateStr)
  const renewal = new Date(start)
  renewal.setMonth(renewal.getMonth() + Number(months))
  const diff = renewal - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Notifications ─────────────────────────────────────────────
// Notification logic has been moved to src/notifications.js
