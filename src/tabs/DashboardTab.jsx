import { useState } from 'react'
import { ageInMonths } from '../utils'
import DateNavigator, { useDateNav } from '../components/DateNavigator'
import * as db from '../db'
import { MILESTONES } from '../data/milestones'

// ─── Vitamin protocol (Tipat Chalav / MOH Israel) ────────────────────────────
function getRequiredVitamins(months, weightKg) {
  const list = []
  if (months < 24)
    list.push({ kind: 'vitd', icon: '☀️', name: 'ויטמין D', dose: "400 יח'", note: 'מגיל לידה עד 2 שנה' })
  if (months >= 4 && months < 18) {
    const dose = weightKg ? `${Math.round(weightKg * 1)} מ"ג` : '1 מ"ג/ק"ג'
    list.push({ kind: 'iron', icon: '🩸', name: 'ברזל', dose, note: 'מגיל 4–18 חודשים' })
  }
  if (months < 12)
    list.push({ kind: 'probiotic', icon: '🦠', name: 'פרוביוטיקה', dose: 'לפי הוראה', note: 'עד גיל שנה' })
  return list
}

// ─── Fever medicine helpers ───────────────────────────────────────────────────
function calcParacetamolDose(w) {
  const mg = Math.round(w * 15)
  return { mg, syrupMl: Math.round(mg / 24 * 10) / 10, intervalHours: 4, maxPerDay: 4 }
}
function calcIbuprofenDose(w) {
  const mg = Math.round(w * 10)
  return { mg, syrupMl: Math.round(mg / 20 * 10) / 10, intervalHours: 6, maxPerDay: 4 }
}
function nextDoseTime(logs, medicine, intervalHours) {
  const last = [...logs].filter(l => l.medicine === medicine).sort((a, b) => b.time > a.time ? 1 : -1)[0]
  if (!last) return null
  const [h, m] = last.time.split(':').map(Number)
  const d = new Date(); d.setHours(h + intervalHours, m, 0, 0)
  return d
}
const fmt = d => d ? d.toTimeString().slice(0, 5) : ''
const nowTime = () => new Date().toTimeString().slice(0, 5)

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardTab({ data, reload, family, activeBaby, babyName, onNavigate, themeColor = '#a78bfa' }) {
  const { dateKey, dateLabel, isToday, goBack, goForward } = useDateNav()

  const [showTempForm,    setShowTempForm]    = useState(false)
  const [tempValue,       setTempValue]       = useState('')
  const [savingTemp,      setSavingTemp]      = useState(false)
  const [showFeverModal,  setShowFeverModal]  = useState(false)
  const [givingMed,       setGivingMed]       = useState(null)
  const [medTime,         setMedTime]         = useState(nowTime())
  const [savingMed,       setSavingMed]       = useState(false)
  const [earlyWarning,    setEarlyWarning]    = useState(null)

  if (!activeBaby) return null

  const babyId    = activeBaby.id
  const todayLogs = (data.babyLog || []).filter(l => l.baby_id === babyId && l.date === dateKey)

  const feeds     = todayLogs.filter(l => l.type === 'feed')
  const diapers   = todayLogs.filter(l => l.type === 'diaper')
  const temps     = todayLogs.filter(l => l.type === 'temperature')
  const feverMeds = todayLogs.filter(l => l.type === 'fever_med')
  const vitamins  = todayLogs.filter(l => l.type === 'vitamin')

  const weightKg  = activeBaby.weight ? parseFloat(activeBaby.weight) : null
  const months    = ageInMonths(activeBaby.birth_date)

  // Feeding
  const feedsPerDay   = activeBaby.feeds_per_day || 8
  const intervalHours = 24 / feedsPerDay
  const sortedFeeds   = [...feeds].sort((a, b) => a.time > b.time ? 1 : -1)
  const lastFeed      = sortedFeeds[sortedFeeds.length - 1]
  const nextFeedTime  = (() => {
    if (!lastFeed?.time) return null
    const [h, m] = lastFeed.time.split(':').map(Number)
    const d = new Date(); d.setHours(h, m + Math.round(intervalHours * 60), 0, 0)
    return d
  })()
  const nextFeedIsNow = nextFeedTime && new Date() >= nextFeedTime
  const totalMl       = feeds.filter(f => f.food_type !== 'breast').reduce((s, f) => s + Number(f.amount || 0), 0)
  const totalBreastMin= feeds.filter(f => f.food_type === 'breast').reduce((s, f) => s + Number(f.duration || 0), 0)
  const dailyTarget   = weightKg ? Math.round(weightKg * 150) : null
  const mlPct         = dailyTarget && totalMl > 0 ? Math.min(100, Math.round(totalMl / dailyTarget * 100)) : 0

  // Diapers
  const peeCount  = diapers.filter(d => d.kind === 'pee' || d.kind === 'both').length
  const poopCount = diapers.filter(d => d.kind === 'poop' || d.kind === 'both').length

  // Temperature
  const lastTemp  = [...temps].sort((a, b) => a.time > b.time ? 1 : -1).pop()
  const hasFever  = lastTemp && parseFloat(lastTemp.temperature) >= 38
  const highFever = lastTemp && parseFloat(lastTemp.temperature) >= 39

  // Fever meds
  const paraNextDate = nextDoseTime(feverMeds, 'paracetamol', 4)
  const ibuNextDate  = nextDoseTime(feverMeds, 'ibuprofen', 6)
  const paraCanGive  = !paraNextDate || new Date() >= paraNextDate
  const ibuCanGive   = months >= 6 && (!ibuNextDate || new Date() >= ibuNextDate)
  const paraDose     = weightKg ? calcParacetamolDose(weightKg) : null
  const ibuDose      = weightKg && months >= 6 ? calcIbuprofenDose(weightKg) : null

  // Vitamins
  const requiredVitamins = getRequiredVitamins(months, weightKg)
  const vitaminsDone     = requiredVitamins.filter(v => vitamins.some(l => l.kind === v.kind)).length
  const allVitsDone      = requiredVitamins.length > 0 && vitaminsDone === requiredVitamins.length

  // Vaccinations
  const upcomingVax = (data.vaccinations || [])
    .filter(v => v.baby_id === babyId && v.status === 'pending')
    .sort((a, b) => a.scheduled_date > b.scheduled_date ? 1 : -1)
  const nextVaccine = upcomingVax[0]
  const overdueVax  = (data.vaccinations || []).filter(v => v.baby_id === babyId && v.status === 'overdue')

  // Meds
  const babyMeds   = (data.meds || []).filter(m => m.baby_id === babyId)
  const todayKey2  = new Date().toISOString().slice(0, 10)
  const medsTaken  = (data.medLog || []).filter(l => l.baby_id === babyId && l.date === todayKey2)
  const totalDoses = babyMeds.reduce((s, m) => s + (m.times?.length || 0), 0)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveTemp = async () => {
    if (!tempValue) return
    const val = parseFloat(tempValue)
    if (isNaN(val) || val < 34 || val > 42) return
    setSavingTemp(true)
    await db.addLog(family.id, babyId, { type: 'temperature', date: dateKey, time: nowTime(), temperature: val })
    await reload(); setTempValue(''); setShowTempForm(false); setSavingTemp(false)
  }

  const handleGiveMed = async (overrideMed) => {
    const med = overrideMed || givingMed
    if (!med) return
    setSavingMed(true)
    const dose = med === 'paracetamol' ? paraDose : ibuDose
    const { data, error } = await db.addLog(family.id, babyId, {
      type: 'fever_med', date: dateKey, time: medTime,
      medicine: med, dose_mg: dose?.mg || null, dose_ml: dose?.syrupMl || null,
    })
    await reload(); setGivingMed(null); setEarlyWarning(null); setShowFeverModal(false); setSavingMed(false)
  }

  const handleEarlyAttempt = (medicine, nextDate) => {
    const lastEntry = [...feverMeds].filter(m => m.medicine === medicine).sort((a, b) => b.time > a.time ? 1 : -1)[0]
    setEarlyWarning({ medicine, lastTime: lastEntry?.time, nextDate })
    setMedTime(nowTime())
  }

  const handleDeleteLog = async (id) => { await db.deleteLog(id); await reload() }

  const handleToggleVitamin = async (kind) => {
    const entry = todayLogs.find(l => l.type === 'vitamin' && l.kind === kind)
    if (entry) await db.deleteLog(entry.id)
    else await db.addLog(family.id, babyId, { type: 'vitamin', kind, date: dateKey, time: nowTime() })
    await reload()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>

      <DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color={themeColor} />

      {/* ── ALERTS BAR ───────────────────────────────────────────── */}
      {overdueVax.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <AlertBanner
            icon="⚠️"
            text={`${overdueVax.length} חיסון/ים שעדיין לא בוצעו — כדאי לתאם עם טיפת החלב`}
            color="#f59e0b"
            action="לפנקס החיסונים"
            onAction={() => onNavigate?.('vaccinations')}
          />
        </div>
      )}

      {/* ── TODAY'S SNAPSHOT — 2-column grid ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>

        {/* Feeding */}
        <BigCard
          icon="🍼" title="האכלות"
          onClick={() => onNavigate?.('feeding')}
          accent={themeColor}
          status={feeds.length === 0 ? 'empty' : nextFeedIsNow ? 'alert' : 'ok'}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: themeColor, lineHeight: 1 }}>
            {feeds.length}
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 400 }}>/{feedsPerDay}</span>
          </div>
          <ProgressBar pct={Math.round(feeds.length / feedsPerDay * 100)} color={themeColor} />
          {totalMl > 0 && (
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
              {totalMl} מ"ל {dailyTarget ? `/ ${dailyTarget} מ"ל` : ''}
            </div>
          )}
          {totalBreastMin > 0 && (
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>{totalBreastMin} דק' הנקה</div>
          )}
          <NextHint
            ready={nextFeedIsNow}
            time={nextFeedTime ? fmt(nextFeedTime) : null}
            color={themeColor}
            emptyText="עדיין לא תועדה האכלה היום"
            readyText="הגיע הזמן להאכיל! 🍼"
            pendingPrefix="האכלה הבאה בערך ב-"
          />
        </BigCard>

        {/* Diapers */}
        <BigCard
          icon="🌸" title="חיתולים"
          onClick={() => onNavigate?.('diapers')}
          accent="#fb923c"
          status={diapers.length === 0 ? 'empty' : 'ok'}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fb923c', lineHeight: 1 }}>{diapers.length}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <DiapChip icon="💧" count={peeCount} label="פיפי" />
            <DiapChip icon="💩" count={poopCount} label="קקי" />
          </div>
          {diapers.length === 0 && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>עדיין לא תועד חיתול היום</div>
          )}
        </BigCard>

        {/* Milestones */}
        <BigCard
          icon="🌟" title="אבני דרך"
          onClick={() => onNavigate?.('growth')}
          accent={themeColor}
          status="ok"
        >
          {(() => {
            const doneMilestoneIds = new Set((data.milestones || []).filter(bm => bm.baby_id === babyId).map(bm => bm.milestone_id))
            // Current: milestones expected now (±2 months) that are NOT yet done
            const current = MILESTONES.filter(m =>
              months >= m.expectedMonth - 1 && months <= m.expectedMonth + 2 && !doneMilestoneIds.has(m.id)
            )
            // All current done → show next upcoming milestones (future, not yet due)
            const allCurrentDone = current.length === 0
            const upcoming = allCurrentDone
              ? MILESTONES.filter(m => m.expectedMonth > months && !doneMilestoneIds.has(m.id)).slice(0, 4)
              : null

            const displayList = allCurrentDone ? upcoming : current.slice(0, 4)

            if (!displayList || displayList.length === 0) return (
              <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>כל אבני הדרך לגיל הזה הושגו! 🎉</div>
            )
            return (
              <>
                {allCurrentDone ? (
                  <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 6, fontWeight: 700 }}>✅ כל הנוכחיות הושגו! הבאים בתור:</div>
                ) : (
                  <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 6, fontWeight: 700 }}>⏳ לגיל הנוכחי:</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {displayList.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>⬜</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: '#e6edf3', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{m.name}</div>
                        {allCurrentDone && (
                          <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>גיל {m.expectedMonth} חודשים</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={e => { e.stopPropagation(); onNavigate?.('growth') }} style={{
                  marginTop: 8, background: 'none', border: `1px solid ${themeColor}50`,
                  borderRadius: 6, padding: '4px 10px', color: themeColor,
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo', width: '100%'
                }}>הצג הכל ›</button>
              </>
            )
          })()}
        </BigCard>

        {/* Vitamins */}
        <BigCard
          icon="💊" title="ויטמינים"
          accent={allVitsDone ? '#22c55e' : '#a78bfa'}
          status={requiredVitamins.length === 0 ? 'ok' : allVitsDone ? 'ok' : 'pending'}
        >
          {requiredVitamins.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>אין ויטמינים לגיל הזה, הכל בסדר 🎉</div>
          ) : (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: allVitsDone ? '#22c55e' : '#a78bfa' }}>
                {vitaminsDone}<span style={{ fontSize: 13, color: '#6b7280', fontWeight: 400 }}>/{requiredVitamins.length}</span>
              </div>
              <ProgressBar pct={Math.round(vitaminsDone / requiredVitamins.length * 100)} color={allVitsDone ? '#22c55e' : '#a78bfa'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {requiredVitamins.map(v => {
                  const given = vitamins.some(l => l.kind === v.kind)
                  return (
                    <button key={v.kind} onClick={() => handleToggleVitamin(v.kind)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: given ? '#22c55e18' : '#21262d',
                      border: `1px solid ${given ? '#22c55e50' : '#30363d'}`,
                      borderRadius: 6, padding: '4px 8px',
                      cursor: 'pointer', fontFamily: 'Heebo', width: '100%'
                    }}>
                      <span style={{ fontSize: 12 }}>{given ? '✅' : '⬜'}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: given ? '#86efac' : '#e6edf3' }}>
                        {v.icon} {v.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </BigCard>
      </div>

      {/* ── TEMPERATURE FULL-WIDTH ───────────────────────────────────── */}
      <div style={{
        background: '#161b22', border: `1px solid ${hasFever ? '#ef444440' : '#30363d'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: hasFever ? '#ef444418' : '#21262d',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
          }}>🌡️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>טמפרטורה</div>
            {lastTemp ? (
              <div style={{ fontSize: 18, fontWeight: 800, color: hasFever ? '#ef4444' : '#22c55e', lineHeight: 1.2 }}>
                {lastTemp.temperature}°C {hasFever && <span style={{ fontSize: 11, fontWeight: 600 }}>חום!</span>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#6b7280' }}>טרם נמדד היום</div>
            )}
            {lastTemp && <div style={{ fontSize: 10, color: '#6b7280' }}>נמדד ב-{lastTemp.time}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {hasFever && (
            <button onClick={() => setShowFeverModal(true)} style={{
              flex: 1, background: '#ef444420', border: '1px solid #ef444440', borderRadius: 8,
              padding: '8px 0', color: '#ef4444', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Heebo'
            }}>💊 טיפול בחום</button>
          )}
          <button onClick={() => setShowTempForm(v => !v)} style={{
            flex: 1, background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
            padding: '8px 0', color: '#e6edf3', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Heebo'
          }}>+ מדוד</button>
        </div>
      </div>

      {/* ── TEMPERATURE QUICK-LOG ─────────────────────────────────── */}
      {showTempForm && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', marginBottom: 10 }}>🌡️ מדידת חום</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['36.5','37.0','37.5','38.0','38.5','39.0','39.5','40.0'].map(t => (
              <button key={t} onClick={() => setTempValue(t)} style={{
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: tempValue === t ? (parseFloat(t) >= 38 ? '#ef444433' : '#22c55e33') : '#21262d',
                color: parseFloat(t) >= 38 ? '#ef4444' : '#22c55e',
                fontFamily: 'Heebo', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>{t}°</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" step="0.1" min="34" max="42" value={tempValue}
              onChange={e => setTempValue(e.target.value)} placeholder="37.2"
              style={{
                flex: 1, background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 10, padding: '10px 12px', color: '#e6edf3',
                fontFamily: 'Heebo', fontSize: 16, outline: 'none'
              }} />
            <button onClick={handleSaveTemp} disabled={savingTemp || !tempValue} style={{
              background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo'
            }}>{savingTemp ? '...' : 'שמור'}</button>
          </div>
        </div>
      )}

      {/* ── TEMPERATURE LOG ──────────────────────────────────────── */}
      {(temps.length > 0 || feverMeds.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {temps.length > 0 && (
            <LogGroup color="#ef4444" label="מדידות חום">
              {[...temps].sort((a,b) => b.time > a.time ? 1 : -1).map(t => {
                const fever = parseFloat(t.temperature) >= 38
                return (
                  <LogRow key={t.id} time={t.time} onDelete={() => handleDeleteLog(t.id)}>
                    <span style={{ fontSize: 15 }}>{fever ? '🔴' : '✅'}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: fever ? '#ef4444' : '#22c55e', flex: 1 }}>
                      {t.temperature}°C
                    </span>
                    {fever && <Chip color="#ef4444">חום</Chip>}
                  </LogRow>
                )
              })}
            </LogGroup>
          )}
          {feverMeds.length > 0 && (
            <LogGroup color="#f59e0b" label="טיפולי חום">
              {[...feverMeds].sort((a,b) => b.time > a.time ? 1 : -1).map(m => {
                const isPara = m.medicine === 'paracetamol'
                const nextD  = isPara ? paraNextDate : ibuNextDate
                const canNow = !nextD || new Date() >= nextD
                return (
                  <div key={m.id}>
                    <LogRow time={m.time} onDelete={() => handleDeleteLog(m.id)}>
                      <span style={{ fontSize: 15 }}>{isPara ? '🟡' : '🟠'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>
                          {isPara ? 'נובימול / פרצטמול' : 'אקמולי / איבופרופן'}
                        </div>
                        {m.dose_ml && <div style={{ fontSize: 10, color: '#8b949e' }}>{m.dose_ml} מ"ל {m.dose_mg ? `(${m.dose_mg}מ"ג)` : ''}</div>}
                      </div>
                    </LogRow>
                    {nextD && (
                      <div style={{
                        margin: '2px 0 6px 0', display: 'flex', alignItems: 'center', gap: 6,
                        background: canNow ? '#22c55e18' : '#f59e0b18',
                        border: `1px solid ${canNow ? '#22c55e30' : '#f59e0b30'}`,
                        borderRadius: 6, padding: '4px 10px'
                      }}>
                        <span style={{ fontSize: 11 }}>{canNow ? '✅' : '⏰'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: canNow ? '#22c55e' : '#f59e0b' }}>
                          {canNow ? 'אפשר לתת עכשיו' : `אפשר לתת שוב ב-${fmt(nextD)}`}
                        </span>
                        <span style={{ fontSize: 10, color: '#6b7280', marginRight: 'auto' }}>
                          {isPara ? '(כל 4ש)' : '(כל 6ש)'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </LogGroup>
          )}
        </div>
      )}

      {/* ── NEXT VACCINATION ──────────────────────────────────────── */}
      {nextVaccine && (
        <div onClick={() => onNavigate?.('vaccinations')} style={{
          background: '#161b22', border: '1px solid #22c55e30', borderRadius: 14,
          padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#22c55e18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
          }}>💉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>חיסון הבא</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{nextVaccine.name}</div>
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
              {nextVaccine.scheduled_date && new Date(nextVaccine.scheduled_date)
                .toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          {nextVaccine.scheduled_date && (() => {
            const days = Math.ceil((new Date(nextVaccine.scheduled_date) - new Date()) / (1000*60*60*24))
            const color = days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e'
            const txt   = days < 0 ? `איחור ${Math.abs(days)}י'` : days === 0 ? 'היום!' : `${days} ימים`
            return (
              <div style={{
                background: color + '20', border: `1px solid ${color}40`,
                borderRadius: 8, padding: '4px 10px',
                fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap'
              }}>{txt}</div>
            )
          })()}
        </div>
      )}

      {/* ── TODAY'S LOG ───────────────────────────────────────────── */}
      {(feeds.length > 0 || diapers.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="📋 יומן היום" />

          {/* Feeds */}
          {feeds.length > 0 && (
            <LogGroup color={themeColor} label="האכלות">
              {[...feeds].reverse().slice(0, 5).map(f => (
                <LogRow key={f.id} time={f.time}>
                  <span style={{ fontSize: 15 }}>{f.food_type === 'breast' ? '🤱' : '🍼'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                    {f.food_type === 'breast' ? 'חלב אם' : f.food_type === 'formula_materna' ? 'מטרנה' : f.food_type === 'formula_nutri' ? 'נוטריילון' : f.food_type === 'solid' ? 'מוצקים' : 'פורמולה'}
                  </span>
                  {f.amount && <Chip color={themeColor}>{f.amount} מ"ל</Chip>}
                  {f.duration && <Chip color="#fb923c">{f.duration} דק'</Chip>}
                </LogRow>
              ))}
            </LogGroup>
          )}

          {/* Diapers */}
          {diapers.length > 0 && (
            <LogGroup color="#fb923c" label="חיתולים">
              {[...diapers].reverse().slice(0, 4).map(d => (
                <LogRow key={d.id} time={d.time}>
                  <span style={{ fontSize: 15 }}>{d.kind === 'pee' ? '💧' : d.kind === 'poop' ? '💩' : '💧💩'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                    {d.kind === 'pee' ? 'פיפי' : d.kind === 'poop' ? 'קקי' : 'פיפי + קקי'}
                  </span>
                </LogRow>
              ))}
            </LogGroup>
          )}

        </div>
      )}

      {/* Empty state */}
      {feeds.length === 0 && diapers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: '#6b7280' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {isToday ? 'לא תועד כלום עדיין היום' : 'אין נתונים לתאריך זה'}
          </div>
          {isToday && <div style={{ fontSize: 12, marginTop: 6 }}>השתמש בטאבים למטה כדי לתעד</div>}
        </div>
      )}

      {/* ── FEVER TREATMENT MODAL ─────────────────────────────────── */}
      {showFeverModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowFeverModal(false); setGivingMed(null) }}>
          <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d', direction: 'rtl', fontFamily: 'Heebo', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#ef4444' }}>💊 טיפול בחום</div>
                {lastTemp && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>חום נוכחי: {lastTemp.temperature}°C</div>}
              </div>
              <button onClick={() => { setShowFeverModal(false); setGivingMed(null) }} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {!weightKg && (
              <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b40', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#f59e0b' }}>
                ⚠️ לא הוזן משקל תינוק — הכמות תחושב לפי 3 ק"ג. עדכן את פרטי התינוק לחישוב מדויק.
              </div>
            )}

            <FeverMedCard name="נובימול / פרצטמול" icon="🟡" color="#f59e0b"
              dose={paraDose || calcParacetamolDose(weightKg || 3)}
              canGive={paraCanGive} nextDate={paraNextDate}
              count={feverMeds.filter(m => m.medicine === 'paracetamol').length}
              note="מתאים מגיל לידה · כל 4 שעות"
              selected={givingMed === 'paracetamol'}
              onGive={() => setGivingMed(givingMed === 'paracetamol' ? null : 'paracetamol')}
              onEarly={() => handleEarlyAttempt('paracetamol', paraNextDate)} />

            {months >= 6 ? (
              <FeverMedCard name="אקמולי / איבופרופן" icon="🟠" color="#fb923c"
                dose={ibuDose || calcIbuprofenDose(weightKg || 3)}
                canGive={ibuCanGive} nextDate={ibuNextDate}
                count={feverMeds.filter(m => m.medicine === 'ibuprofen').length}
                note="מגיל 6 חודשים · כל 6 שעות"
                selected={givingMed === 'ibuprofen'}
                onGive={() => setGivingMed(givingMed === 'ibuprofen' ? null : 'ibuprofen')}
                onEarly={() => handleEarlyAttempt('ibuprofen', ibuNextDate)} />
            ) : (
              <div style={{ opacity: 0.5, background: '#21262d', border: '1px solid #30363d', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>🟠</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#8b949e' }}>אקמולי / איבופרופן</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>מותר רק מגיל 6 חודשים (גיל נוכחי: {months} חודשים)</div>
                  </div>
                </div>
              </div>
            )}

            {givingMed && (
              <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, padding: 14, marginTop: 4 }}>
                <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 10 }}>
                  תיעוד מתן {givingMed === 'paracetamol' ? 'נובימול' : 'אקמולי'}
                </div>
                <input type="time" value={medTime} onChange={e => setMedTime(e.target.value)} style={{
                  width: '100%', background: '#161b22', border: '1px solid #30363d',
                  borderRadius: 8, padding: '9px 12px', color: '#e6edf3',
                  fontFamily: 'Heebo', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10
                }} />
                <button onClick={() => handleGiveMed()} disabled={savingMed} style={{
                  width: '100%', padding: '12px 0', background: savingMed ? '#4b2200' : '#f59e0b',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>
                  {savingMed ? '...' : `✅ תעד מתן ${givingMed === 'paracetamol' ? 'נובימול' : 'אקמולי'}`}
                </button>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 16, lineHeight: 1.7, borderTop: '1px solid #21262d', paddingTop: 12 }}>
              ⚕️ המידע מבוסס על פרוטוקול טיפת חלב. בחום מעל 39° או ממשיך מעל 48 שעות — פנה לרופא.
            </div>
          </div>
        </div>
      )}

      {/* ── EARLY-DOSE WARNING MODAL ──────────────────────────────── */}
      {earlyWarning && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEarlyWarning(null)}>
          <div style={{ background: '#161b22', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, border: '2px solid #ef444460', direction: 'rtl', fontFamily: 'Heebo' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>אזהרה — מנה מוקדמת!</div>
                <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                  {earlyWarning.medicine === 'paracetamol' ? 'נובימול / פרצטמול' : 'אקמולי / איבופרופן'}
                </div>
              </div>
            </div>

            <div style={{ background: '#ef444412', border: '1px solid #ef444430', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <InfoRow label="מנה אחרונה ניתנה ב:" value={`🕐 ${earlyWarning.lastTime}`} />
              <InfoRow label="מנה הבאה מותרת ב:" value={`⏰ ${fmt(earlyWarning.nextDate)}`} valueColor="#f59e0b" />
              <InfoRow label="הפרש זמן:" value={(() => {
                const d = Math.ceil((earlyWarning.nextDate - new Date()) / 60000)
                return d >= 60 ? `עוד ${Math.ceil(d/60)} שעות` : `עוד ${d} דקות`
              })()} valueColor="#ef4444" />
            </div>

            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 16, lineHeight: 1.6, background: '#f59e0b12', borderRadius: 8, padding: '10px 12px' }}>
              ⚠️ מתן תרופה לפני הזמן עלול לגרום לחריגה ממינון מקסימלי.
            </div>

            <input type="time" value={medTime} onChange={e => setMedTime(e.target.value)} style={{
              width: '100%', background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, padding: '9px 12px', color: '#e6edf3',
              fontFamily: 'Heebo', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => handleGiveMed(earlyWarning.medicine)} disabled={savingMed} style={{
                padding: '12px 0', background: savingMed ? '#4b0f0f' : '#ef4444',
                color: '#fff', border: 'none', borderRadius: 10,
                fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}>
                {savingMed ? '...' : `✅ כן, תן בכל זאת`}
              </button>
              <button onClick={() => setEarlyWarning(null)} style={{
                padding: '11px 0', background: 'transparent',
                color: '#8b949e', border: '1px solid #30363d', borderRadius: 10,
                fontFamily: 'Heebo', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>
                ביטול — אמתין עד {fmt(earlyWarning.nextDate)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function AlertBanner({ icon, text, color, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: color + '18', border: `1px solid ${color}40`,
      borderRadius: 12, padding: '10px 14px'
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color }}>{text}</span>
      {action && (
        <button onClick={onAction} style={{
          background: color, color: '#fff', border: 'none', borderRadius: 8,
          padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo', whiteSpace: 'nowrap'
        }}>{action}</button>
      )}
    </div>
  )
}

function BigCard({ icon, title, accent, status, action, onClick, children }) {
  const statusBg = status === 'danger' ? '#ef444410' : status === 'warning' ? '#f59e0b08' : status === 'alert' ? accent + '12' : '#161b22'
  const statusBorder = status === 'danger' ? '#ef444440' : status === 'warning' ? '#f59e0b40' : status === 'alert' ? accent + '50' : accent + '25'

  return (
    <div onClick={onClick} style={{
      background: statusBg, border: `1px solid ${statusBorder}`,
      borderRadius: 16, padding: 14,
      cursor: onClick ? 'pointer' : 'default'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 600 }}>{title}</span>
        </div>
        {action && (
          <button onClick={e => { e.stopPropagation(); action.onClick() }} style={{
            background: 'none', border: 'none', fontSize: 11, color: '#58a6ff',
            cursor: 'pointer', fontFamily: 'Heebo', padding: 0
          }}>{action.label}</button>
        )}
      </div>
      {children}
    </div>
  )
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ background: '#30363d', borderRadius: 4, height: 5, marginTop: 8 }}>
      <div style={{
        background: pct >= 100 ? '#22c55e' : color,
        height: 5, borderRadius: 4, width: `${Math.min(100, pct)}%`,
        transition: 'width 0.4s'
      }} />
    </div>
  )
}

function NextHint({ ready, time, color, emptyText, readyText, pendingPrefix }) {
  if (!time) return <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{emptyText}</div>
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: ready ? color + '20' : '#21262d',
      border: `1px solid ${ready ? color + '50' : '#30363d'}`,
      borderRadius: 6, padding: '4px 8px', marginTop: 8
    }}>
      <span style={{ fontSize: 10 }}>{ready ? '🍼' : '⏰'}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: ready ? color : '#8b949e' }}>
        {ready ? readyText : `${pendingPrefix} ${time}`}
      </span>
    </div>
  )
}

function DiapChip({ icon, count, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: '#21262d', borderRadius: 8, padding: '4px 8px'
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#e6edf3' }}>{count}</span>
      <span style={{ fontSize: 10, color: '#6b7280' }}>{label}</span>
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#8b949e', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #21262d' }}>
      {title}
    </div>
  )
}

function LogGroup({ color, label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function LogRow({ time, onDelete, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#161b22', borderRadius: 8, padding: '7px 10px', marginBottom: 4
    }}>
      {children}
      <span style={{ fontSize: 11, color: '#58a6ff', flexShrink: 0 }}>{time}</span>
      {onDelete && (
        <button onClick={onDelete} style={{
          background: 'none', border: 'none', color: '#374151',
          fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1
        }}>✕</button>
      )}
    </div>
  )
}

function Chip({ color, children }) {
  return (
    <span style={{ background: color + '22', color, borderRadius: 5, padding: '1px 6px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
      {children}
    </span>
  )
}

function FeverMedCard({ name, icon, color, dose, canGive, nextDate, count, note, selected, onGive, onEarly }) {
  const maxReached = count >= dose.maxPerDay
  return (
    <div style={{
      background: selected ? color + '15' : '#21262d',
      border: `1px solid ${selected ? color + '60' : canGive && !maxReached ? color + '30' : '#30363d'}`,
      borderRadius: 14, padding: 14, marginBottom: 12, opacity: maxReached ? 0.6 : 1
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e6edf3' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#8b949e' }}>{note}</div>
        </div>
        <div style={{ textAlign: 'center', background: color + '22', borderRadius: 8, padding: '6px 10px', minWidth: 56 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color }}>{dose.syrupMl}<span style={{ fontSize: 9 }}> מ"ל</span></div>
          <div style={{ fontSize: 9, color: '#8b949e' }}>{dose.mg} מ"ג</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: maxReached ? 0 : 10 }}>
        <span style={{ fontSize: 11, color: '#8b949e' }}>ניתן היום: <span style={{ fontWeight: 700, color: count > 0 ? color : '#6b7280' }}>{count}/{dose.maxPerDay}</span></span>
        {!canGive && nextDate && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⏰ ב-{fmt(nextDate)}</span>}
        {maxReached && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>מקסימום מנות</span>}
      </div>
      {!maxReached && (
        canGive
          ? <button onClick={onGive} style={{
              width: '100%', padding: '9px 0',
              background: selected ? color : color + '22', color: selected ? '#fff' : color,
              border: `1px solid ${color}40`, borderRadius: 10,
              fontFamily: 'Heebo', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>{selected ? '▲ ביטול' : `💊 תן ${name.split(' / ')[0]}`}</button>
          : <button onClick={onEarly} style={{
              width: '100%', padding: '9px 0', background: '#ef444415', color: '#ef4444',
              border: '1px solid #ef444430', borderRadius: 10,
              fontFamily: 'Heebo', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>⚠️ תן בכל זאת (לפני הזמן)</button>
      )}
    </div>
  )
}

function InfoRow({ label, value, valueColor = '#e6edf3' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#8b949e' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: valueColor }}>{value}</span>
    </div>
  )
}
