/**
 * BabyCare — Push Notification System
 *
 * Manages scheduling of browser push notifications for:
 *  - Feeding reminders (next feed based on feeds_per_day interval)
 *  - Fever medicine — when next dose is allowed (paracetamol / ibuprofen)
 *  - Temperature check reminder (every 2h when fever is active)
 *  - Scheduled medications (from meds table, by time-of-day)
 *  - Upcoming vaccinations (day-before + same-day reminders)
 *
 * All scheduled timeouts are tracked in a module-level Map so they can
 * be cancelled and rescheduled when data changes.
 */

// ─── Timeout registry ────────────────────────────────────────────────────────
const _timers = new Map()

function _cancel(key) {
  if (_timers.has(key)) {
    clearTimeout(_timers.get(key))
    _timers.delete(key)
  }
}

function _schedule(key, delayMs, fn) {
  _cancel(key)
  if (delayMs <= 0) return          // already past — skip
  if (delayMs > 24 * 60 * 60 * 1000) return   // more than 24h away — skip for now
  const id = setTimeout(() => {
    _timers.delete(key)
    fn()
  }, delayMs)
  _timers.set(key, id)
}

// ─── Low-level notification sender ──────────────────────────────────────────
function _notify(title, body, tag, icon = '/images/BabyCareLogo.png') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon, tag, renotify: true, requireInteraction: false })
  } catch {
    // Some browsers block Notification constructor in certain contexts — silently ignore
  }
}

// ─── Permission ──────────────────────────────────────────────────────────────
export async function requestPermission() {
  if (!('Notification' in window)) return false
  // Notification permission prompts generally require a secure context (HTTPS),
  // except localhost. If not secure, browsers will deny silently or throw.
  if (typeof window !== 'undefined' && window.isSecureContext === false) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function hasPermission() {
  return 'Notification' in window && Notification.permission === 'granted'
}

// ─── Main entry point ────────────────────────────────────────────────────────
/**
 * Call this whenever app data changes. It cancels all existing timers and
 * reschedules according to current state.
 *
 * @param {object} opts
 * @param {object}   opts.activeBaby   — baby object { id, name, birth_date, weight, feeds_per_day, gender }
 * @param {Array}    opts.babyLog      — all log entries for this baby from Supabase
 * @param {Array}    opts.meds         — scheduled medications
 * @param {Array}    opts.vaccinations — vaccination records
 * @param {object}   opts.prefs        — user preferences: { feeding, meds, vaccines, temp, fever_med }
 */
export function scheduleAllNotifications({ activeBaby, babyLog, meds, vaccinations, prefs = {} }) {
  if (!hasPermission()) return
  if (!activeBaby) return

  const now        = new Date()
  const todayKey   = now.toISOString().slice(0, 10)
  const babyId     = activeBaby.id
  const babyName   = activeBaby.name || 'התינוק'
  const weightKg   = activeBaby.weight ? parseFloat(activeBaby.weight) : null

  // Birth date → age in months
  const birthMs    = activeBaby.birth_date ? new Date(activeBaby.birth_date).getTime() : null
  const ageMonths  = birthMs ? Math.floor((Date.now() - birthMs) / (1000 * 60 * 60 * 24 * 30.44)) : null

  const todayLogs  = (babyLog || []).filter(l => l.baby_id === babyId && l.date === todayKey)

  const p = { feeding: true, meds: true, vaccines: true, temp: true, fever_med: true, ...prefs }

  // ── 1. Feeding reminder ──────────────────────────────────────────────────
  if (p.feeding) _scheduleFeedingReminder(activeBaby, todayLogs, babyName)
  else           _cancel('feed-next'), _cancel('feed-first')

  // ── 2. Fever medicine reminders ──────────────────────────────────────────
  if (p.fever_med) _scheduleFeverMedReminders(todayLogs, babyName, weightKg, ageMonths)
  else             _cancel('fever-paracetamol'), _cancel('fever-ibuprofen')

  // ── 3. Temperature check reminder (when fever active) ───────────────────
  if (p.temp) _scheduleTempCheckReminder(todayLogs, babyName)
  else        _cancel('temp-check')

  // ── 4. Scheduled medications ─────────────────────────────────────────────
  if (p.meds) _scheduleMedReminders(meds, babyId, babyName)
  // (if disabled, existing med timers will just not be rescheduled on next call)

  // ── 5. Vaccination reminders ─────────────────────────────────────────────
  if (p.vaccines) _scheduleVaccinationReminders(vaccinations, babyId, babyName)
}

// ─── Cancel all active timers ─────────────────────────────────────────────
export function cancelAllNotifications() {
  for (const [key] of _timers) {
    _cancel(key)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal schedulers
// ─────────────────────────────────────────────────────────────────────────────

function _scheduleFeedingReminder(activeBaby, todayLogs, babyName) {
  const feedsPerDay   = activeBaby.feeds_per_day || 8
  const intervalHours = 24 / feedsPerDay
  const feeds         = todayLogs.filter(l => l.type === 'feed')

  if (!feeds.length) {
    // No feeds yet today — remind in 1h if it's morning
    const now = new Date()
    if (now.getHours() >= 6 && now.getHours() < 9) {
      _schedule('feed-first', 60 * 60 * 1000, () => {
        _notify(
          `🍼 האכלה — ${babyName}`,
          `טרם תועדה האכלה ראשונה היום`,
          'feed-first'
        )
      })
    }
    return
  }

  const sorted   = [...feeds].sort((a, b) => (a.time > b.time ? 1 : -1))
  const lastFeed = sorted[sorted.length - 1]
  const [h, m]   = lastFeed.time.split(':').map(Number)

  const nextFeed = new Date()
  nextFeed.setHours(h, m + Math.round(intervalHours * 60), 0, 0)

  // If next feed time passed midnight, push to tomorrow
  if (nextFeed < new Date()) {
    nextFeed.setDate(nextFeed.getDate() + 1)
  }

  const delay = nextFeed - new Date()
  _schedule('feed-next', delay, () => {
    _notify(
      `🍼 הגיע זמן האכלה — ${babyName}`,
      `${feeds.length + 1} מתוך ${feedsPerDay} האכלות היום · זמן: ${_fmt(nextFeed)}`,
      'feed-next'
    )
  })
}

function _scheduleFeverMedReminders(todayLogs, babyName, weightKg, ageMonths) {
  const feverMeds = todayLogs.filter(l => l.type === 'fever_med')

  // Paracetamol — every 4h
  _scheduleOneMedReminder(feverMeds, 'paracetamol', 4, (next) => {
    _notify(
      `💊 מותר לתת פרצטמול — ${babyName}`,
      `עברו 4 שעות מהמנה האחרונה · ניתן לתת נובימול/אקמולי בשעה ${_fmt(next)}`,
      'fever-para'
    )
  })

  // Ibuprofen — every 6h, only from 6 months
  if (ageMonths !== null && ageMonths >= 6) {
    _scheduleOneMedReminder(feverMeds, 'ibuprofen', 6, (next) => {
      _notify(
        `💊 מותר לתת איבופרופן — ${babyName}`,
        `עברו 6 שעות מהמנה האחרונה · ניתן לתת אדוויל/נורופן בשעה ${_fmt(next)}`,
        'fever-ibu'
      )
    })
  }
}

function _scheduleOneMedReminder(feverMeds, medicineName, intervalHours, callback) {
  const relevant = feverMeds
    .filter(l => l.medicine === medicineName)
    .sort((a, b) => (b.time > a.time ? 1 : -1))

  if (!relevant.length) return

  const last = relevant[0]
  const [h, m] = last.time.split(':').map(Number)

  const next = new Date()
  next.setHours(h + intervalHours, m, 0, 0)

  const delay = next - new Date()
  _schedule(`fever-${medicineName}`, delay, () => callback(next))
}

function _scheduleTempCheckReminder(todayLogs, babyName) {
  const temps = todayLogs.filter(l => l.type === 'temperature')
  if (!temps.length) return

  const last    = [...temps].sort((a, b) => (a.time > b.time ? 1 : -1)).pop()
  const hasFever = parseFloat(last.temperature) >= 38

  if (!hasFever) {
    _cancel('temp-check')
    return
  }

  const [h, m] = last.time.split(':').map(Number)
  const next   = new Date()
  next.setHours(h, m + 120, 0, 0)   // +2 hours

  const delay = next - new Date()
  _schedule('temp-check', delay, () => {
    _notify(
      `🌡️ בדיקת חום — ${babyName}`,
      `חלפו 2 שעות מהמדידה האחרונה (${last.temperature}°C) — מומלץ למדוד שוב`,
      'temp-check'
    )
  })
}

function _scheduleMedReminders(meds, babyId, babyName) {
  const defaultHours = { 'בוקר': '08:00', 'צהריים': '13:00', 'ערב': '19:00', 'לילה': '22:00' }
  const now = new Date()

  const babyMeds = (meds || []).filter(m => m.baby_id === babyId)

  babyMeds.forEach(med => {
    ;(med.times || []).forEach(timeName => {
      const timeStr = med.time_hours?.[timeName] || defaultHours[timeName]
      if (!timeStr) return

      const [h, m2] = timeStr.split(':').map(Number)
      const target  = new Date()
      target.setHours(h, m2, 0, 0)

      const delay = target - now
      const key   = `med-${med.id}-${timeName}`

      _schedule(key, delay, () => {
        _notify(
          `💊 זמן תרופה — ${babyName}`,
          `${med.name}${med.dose ? ' · ' + med.dose : ''}${med.instructions ? ' · ' + med.instructions : ''}`,
          key
        )
      })
    })
  })
}

function _scheduleVaccinationReminders(vaccinations, babyId, babyName) {
  const now     = new Date()
  const todayMs = new Date(now.toISOString().slice(0, 10)).getTime()

  const pending = (vaccinations || []).filter(v => v.baby_id === babyId && v.status === 'pending')

  pending.forEach(vax => {
    if (!vax.scheduled_date) return
    const vaxMs = new Date(vax.scheduled_date).getTime()

    // Remind the day before at 09:00
    const dayBefore = new Date(vaxMs - 24 * 60 * 60 * 1000)
    dayBefore.setHours(9, 0, 0, 0)
    const delayBefore = dayBefore - now
    _schedule(`vax-before-${vax.id}`, delayBefore, () => {
      _notify(
        `💉 חיסון מחר — ${babyName}`,
        `מחר יש לבצע: ${vax.name} (${vax.age_label}) — זמן לתיאום עם טיפת חלב`,
        `vax-before-${vax.id}`
      )
    })

    // Remind same day at 09:00
    const sameDay = new Date(vaxMs)
    sameDay.setHours(9, 0, 0, 0)
    const delaySame = sameDay - now
    _schedule(`vax-today-${vax.id}`, delaySame, () => {
      _notify(
        `💉 חיסון היום — ${babyName}`,
        `היום יש לבצע: ${vax.name} (${vax.age_label})`,
        `vax-today-${vax.id}`
      )
    })

    // Overdue — if scheduled_date < today → fire immediately (once) with overdue alert
    if (vaxMs < todayMs) {
      const key = `vax-overdue-${vax.id}`
      if (!_timers.has(key)) {
        // Send it once with a 2s delay to not fire on every re-render
        _schedule(key, 2000, () => {
          _notify(
            `⚠️ חיסון באיחור — ${babyName}`,
            `לא בוצע: ${vax.name} (${vax.age_label}) — פנה לטיפת חלב לתיאום`,
            key
          )
        })
      }
    }
  })
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function _fmt(date) {
  return date.toTimeString().slice(0, 5)
}
