export const TIMES = ['בוקר', 'צהריים', 'ערב', 'לילה']
export const TIME_ICONS = { 'בוקר': '🌅', 'צהריים': '☀️', 'ערב': '🌆', 'לילה': '🌙' }
export const TIME_COLORS = { 'בוקר': '#f59e0b', 'צהריים': '#10b981', 'ערב': '#6366f1', 'לילה': '#8b5cf6' }
export const MED_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#ec4899','#14b8a6']
export const INSTRUCTIONS = [
  'עם אוכל', 'בצום', 'שעה לפני האוכל', 'לא לשבור', 'לא ללעוס',
  'עם מים בלבד', 'להניח מתחת ללשון', 'לפני שינה', 'אחרי אוכל'
]
export const STORAGE_KEY = 'medtracker_v1'

export function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { meds: [], log: [], inventory: [] } }
  catch { return { meds: [], log: [], inventory: [] } }
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
