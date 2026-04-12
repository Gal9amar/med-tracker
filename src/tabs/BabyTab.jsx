import { useState } from 'react'
import { uid } from '../utils'
import DateNavigator, { useDateNav } from '../components/DateNavigator'

function timeNow() { return new Date().toTimeString().slice(0, 5) }

const FOOD_TYPES = [
  { id: 'breast',          label: 'חלב אם',       icon: '🤱' },
  { id: 'formula_materna', label: 'מטרנה',        icon: '🍼' },
  { id: 'formula_nutri',   label: 'נוטריילון',    icon: '🍼' },
  { id: 'formula_other',   label: 'פורמולה אחרת', icon: '🍼' },
  { id: 'solid',           label: 'מוצקים',       icon: '🥣' },
]
const DIAPER_LABELS = { pee: 'פיפי', poop: 'קקי', both: 'שניהם' }
const VITAMIN_DEFAULTS = [
  { name: 'ויטמין D', dose: "400 יח'", icon: '☀️' },
  { name: 'ברזל',     dose: '1 מ"ג/ק"ג', icon: '🩸' },
  { name: 'פרוביוטיקה', dose: 'לפי הוראה', icon: '🦠' },
]
const TEMP_THRESHOLDS = { normal: 37.5, low_fever: 38, fever: 38.5, high_fever: 39 }

export default function BabyTab({ data, update, activeBaby }) {
  const { dateKey, dateLabel, isToday, goBack, goForward } = useDateNav()

  const babyId = activeBaby?.id
  const allBabyLog = data.babyLog || []
  const dayLog = allBabyLog.filter(l => l.babyId === babyId && l.date === dateKey)

  const feeds   = dayLog.filter(l => l.type === 'feed').sort((a, b) => b.time > a.time ? 1 : -1)
  const diapers = dayLog.filter(l => l.type === 'diaper').sort((a, b) => b.time > a.time ? 1 : -1)
  const vitamins = dayLog.filter(l => l.type === 'vitamin')
  const sleeps  = dayLog.filter(l => l.type === 'sleep').sort((a, b) => b.startTime > a.startTime ? 1 : -1)
  const temps   = dayLog.filter(l => l.type === 'temperature').sort((a, b) => b.time > a.time ? 1 : -1)

  // Daily totals
  const totalMl = feeds
    .filter(f => f.foodType !== 'breast' && f.amount)
    .reduce((s, f) => s + Number(f.amount || 0), 0)
  const totalBreastMin = feeds
    .filter(f => f.foodType === 'breast' && f.duration)
    .reduce((s, f) => s + Number(f.duration || 0), 0)
  const totalSleepMin = sleeps.filter(s => s.startTime && s.endTime).reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    let m = (eh * 60 + em) - (sh * 60 + sm)
    if (m < 0) m += 24 * 60
    return sum + m
  }, 0)

  const weightKg = activeBaby?.weight ? parseFloat(activeBaby.weight) : null
  const dailyTarget = weightKg ? Math.round(weightKg * 150) : null

  // ── Feed modal ──
  const [feedModal, setFeedModal] = useState(false)
  const [feedForm, setFeedForm] = useState({ type: 'breast', amount: '', duration: '', time: timeNow(), notes: '' })
  const setFF = (k, v) => setFeedForm(f => ({ ...f, [k]: v }))

  const addFeed = () => {
    const entry = { ...feedForm, id: uid(), babyId, date: dateKey, type: 'feed', foodType: feedForm.type }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
    setFeedModal(false)
    setFeedForm({ type: 'breast', amount: '', duration: '', time: timeNow(), notes: '' })
  }

  // ── Diaper ──
  const addDiaper = (kind) => {
    const entry = { id: uid(), babyId, date: dateKey, type: 'diaper', kind, time: timeNow() }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
  }

  // ── Vitamins ──
  const toggleVitamin = (name) => {
    const exists = vitamins.find(v => v.name === name)
    if (exists) {
      update(prev => ({ ...prev, babyLog: (prev.babyLog || []).filter(l => l.id !== exists.id) }))
    } else {
      update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), { id: uid(), babyId, date: dateKey, type: 'vitamin', name, time: timeNow() }] }))
    }
  }

  // ── Sleep modal ──
  const [sleepModal, setSleepModal] = useState(false)
  const [sleepForm, setSleepForm] = useState({ startTime: '', endTime: '', notes: '' })
  const setSF = (k, v) => setSleepForm(f => ({ ...f, [k]: v }))

  const addSleep = () => {
    const entry = { id: uid(), babyId, date: dateKey, type: 'sleep', ...sleepForm }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
    setSleepModal(false)
    setSleepForm({ startTime: '', endTime: '', notes: '' })
  }

  // ── Temperature modal ──
  const [tempModal, setTempModal] = useState(false)
  const [tempForm, setTempForm] = useState({ value: '', time: timeNow(), notes: '' })
  const setTF = (k, v) => setTempForm(f => ({ ...f, [k]: v }))

  const addTemp = () => {
    const entry = { id: uid(), babyId, date: dateKey, type: 'temperature', ...tempForm }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
    setTempModal(false)
    setTempForm({ value: '', time: timeNow(), notes: '' })
  }

  const deleteLog = (id) => update(prev => ({ ...prev, babyLog: (prev.babyLog || []).filter(l => l.id !== id) }))

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      {/* Date navigator */}
      <DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color="#f472b6" />

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
        {[
          { label: 'האכלות', value: feeds.length, icon: '🍼', color: '#f472b6' },
          { label: 'חיתולים', value: diapers.length, icon: '🌸', color: '#fb923c' },
          { label: 'שינה', value: totalSleepMin > 0 ? `${Math.round(totalSleepMin/60*10)/10}ש'` : sleeps.length, icon: '😴', color: '#60a5fa' },
          { label: 'ויטמינים', value: vitamins.length, icon: '☀️', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161b22', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 16 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FEEDING ── */}
      <Section title="🍼 האכלה" color="#f472b6">
        {isToday && (
          <button onClick={() => setFeedModal(true)} style={actionBtn('#f472b6')}>
            + רשום האכלה
          </button>
        )}
        {feeds.length === 0
          ? <EmptyState text={isToday ? 'אין האכלות מתועדות' : 'אין האכלות ביום זה'} />
          : (
            <div>
              {feeds.map(f => {
                const mlPct = weightKg && f.amount && dailyTarget
                  ? Math.round((Number(f.amount) / dailyTarget) * 100) : null
                return (
                  <div key={f.id} style={rowCard()}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{FOOD_TYPES.find(t => t.id === f.foodType)?.icon || '🍼'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{FOOD_TYPES.find(t => t.id === f.foodType)?.label}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        {f.amount && <span style={badge('#f472b6')}>{f.amount} מ"ל</span>}
                        {f.duration && <span style={badge('#fb923c')}>{f.duration} דק'</span>}
                        {mlPct !== null && <span style={badge(mlPct >= 20 ? '#22c55e' : '#6b7280')}>{mlPct}% מהיעד</span>}
                        {f.notes && <span style={{ fontSize: 11, color: '#6b7280' }}>{f.notes}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: '#58a6ff', fontWeight: 700, flexShrink: 0 }}>{f.time}</span>
                    {isToday && <button onClick={() => deleteLog(f.id)} style={delBtn()}>✕</button>}
                  </div>
                )
              })}
              {(totalMl > 0 || totalBreastMin > 0) && (
                <div style={{ background: '#f472b610', border: '1px dashed #f472b633', borderRadius: 8, padding: '8px 12px', marginTop: 6, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>סה"כ:</span>
                  {totalMl > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: '#f9a8d4' }}>{totalMl} מ"ל {dailyTarget ? `/ ${dailyTarget} יעד` : ''}</span>}
                  {totalBreastMin > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: '#fdba74' }}>{totalBreastMin} דק' חלב אם</span>}
                  {dailyTarget && totalMl > 0 && (
                    <span style={{ marginRight: 'auto', fontSize: 12, fontWeight: 700, color: totalMl >= dailyTarget * 0.8 ? '#22c55e' : '#f59e0b' }}>
                      {Math.round((totalMl / dailyTarget) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        }
      </Section>

      {/* ── DIAPERS ── */}
      <Section title="🌸 חיתולים" color="#fb923c">
        {isToday && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => addDiaper('pee')}  style={{ ...actionBtn('#60a5fa'), flex: 1, marginBottom: 0 }}>💧 פיפי</button>
            <button onClick={() => addDiaper('poop')} style={{ ...actionBtn('#fb923c'), flex: 1, marginBottom: 0 }}>💩 קקי</button>
            <button onClick={() => addDiaper('both')} style={{ ...actionBtn('#a78bfa'), flex: 1, marginBottom: 0 }}>שניהם</button>
          </div>
        )}
        {diapers.length === 0
          ? <EmptyState text={isToday ? 'אין חיתולים מתועדים' : 'אין חיתולים ביום זה'} />
          : diapers.map(d => (
            <div key={d.id} style={rowCard()}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{d.kind === 'pee' ? '💧' : d.kind === 'poop' ? '💩' : '💧💩'}</span>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{DIAPER_LABELS[d.kind]}</div>
              <span style={{ fontSize: 12, color: '#58a6ff', fontWeight: 700 }}>{d.time}</span>
              {isToday && <button onClick={() => deleteLog(d.id)} style={delBtn()}>✕</button>}
            </div>
          ))
        }
      </Section>

      {/* ── SLEEP ── */}
      <Section title="😴 שינה" color="#60a5fa">
        {isToday && (
          <button onClick={() => setSleepModal(true)} style={actionBtn('#60a5fa')}>
            + רשום שינה
          </button>
        )}
        {sleeps.length === 0
          ? <EmptyState text={isToday ? 'לא תועדה שינה היום' : 'אין שינה ביום זה'} />
          : (
            <div>
              {sleeps.map(s => {
                let durationMin = null
                if (s.startTime && s.endTime) {
                  const [sh, sm] = s.startTime.split(':').map(Number)
                  const [eh, em] = s.endTime.split(':').map(Number)
                  durationMin = (eh * 60 + em) - (sh * 60 + sm)
                  if (durationMin < 0) durationMin += 24 * 60
                }
                return (
                  <div key={s.id} style={rowCard()}>
                    <span style={{ fontSize: 20 }}>😴</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {s.startTime} {s.endTime ? `– ${s.endTime}` : '(בתהליך)'}
                      </div>
                      {durationMin !== null && (
                        <div style={{ fontSize: 11, color: '#8b949e' }}>
                          {Math.floor(durationMin / 60)}ש' {durationMin % 60}דק'
                        </div>
                      )}
                      {s.notes && <div style={{ fontSize: 11, color: '#6b7280' }}>{s.notes}</div>}
                    </div>
                    {isToday && <button onClick={() => deleteLog(s.id)} style={delBtn()}>✕</button>}
                  </div>
                )
              })}
              {totalSleepMin > 0 && (
                <div style={{ background: '#60a5fa10', border: '1px dashed #60a5fa33', borderRadius: 8, padding: '8px 12px', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>סה"כ שינה: </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#93c5fd' }}>
                    {Math.floor(totalSleepMin / 60)}ש' {totalSleepMin % 60}דק'
                  </span>
                </div>
              )}
            </div>
          )
        }
      </Section>

      {/* ── TEMPERATURE ── */}
      <Section title="🌡️ חום" color="#f87171">
        {isToday && (
          <button onClick={() => setTempModal(true)} style={actionBtn('#f87171')}>
            + מדוד חום
          </button>
        )}
        {temps.length === 0
          ? <EmptyState text={isToday ? 'לא נמדד חום היום' : 'אין מדידות חום ביום זה'} />
          : temps.map(t => {
            const val = parseFloat(t.value)
            const color = val >= TEMP_THRESHOLDS.high_fever ? '#ef4444' : val >= TEMP_THRESHOLDS.fever ? '#f97316' : val >= TEMP_THRESHOLDS.low_fever ? '#f59e0b' : '#22c55e'
            const label = val >= TEMP_THRESHOLDS.high_fever ? 'קדחת גבוהה!' : val >= TEMP_THRESHOLDS.fever ? 'קדחת' : val >= TEMP_THRESHOLDS.low_fever ? 'קדחת נמוכה' : 'תקין'
            return (
              <div key={t.id} style={rowCard()}>
                <span style={{ fontSize: 20 }}>🌡️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color }}>{t.value}°C</div>
                  <div style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</div>
                  {t.notes && <div style={{ fontSize: 11, color: '#6b7280' }}>{t.notes}</div>}
                </div>
                <span style={{ fontSize: 12, color: '#58a6ff', fontWeight: 700 }}>{t.time}</span>
                {isToday && <button onClick={() => deleteLog(t.id)} style={delBtn()}>✕</button>}
              </div>
            )
          })
        }
      </Section>

      {/* ── VITAMINS ── */}
      <Section title="☀️ ויטמינים ותוספים" color="#fbbf24">
        {[
          ...VITAMIN_DEFAULTS,
          ...(data.meds || []).filter(m => m.babyId === babyId).map(m => ({ name: m.name, dose: m.dose, icon: '💊' }))
        ].map(v => {
          const taken = vitamins.some(x => x.name === v.name)
          return (
            <div key={v.name} style={{ ...rowCard(), background: taken ? '#fbbf2410' : '#161b22', border: `1px solid ${taken ? '#fbbf2440' : '#30363d'}` }}>
              <span style={{ fontSize: 18 }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                {v.dose && <div style={{ fontSize: 11, color: '#8b949e' }}>{v.dose}</div>}
              </div>
              {isToday
                ? <button onClick={() => toggleVitamin(v.name)} style={{ borderRadius: 8, border: 'none', cursor: 'pointer', padding: '5px 12px', background: taken ? '#238636' : '#388bfd', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Heebo' }}>
                    {taken ? '✓ ניתן' : 'ניתן'}
                  </button>
                : <span style={{ fontSize: 13, color: taken ? '#22c55e' : '#6b7280', fontWeight: 700 }}>{taken ? '✓' : '—'}</span>
              }
            </div>
          )
        })}
      </Section>

      {/* ── FEED MODAL ── */}
      {feedModal && (
        <Modal title="🍼 רישום האכלה" onClose={() => setFeedModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>סוג האכלה</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FOOD_TYPES.map(t => (
                  <button key={t.id} onClick={() => setFF('type', t.id)} style={{
                    padding: '7px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: feedForm.type === t.id ? '#f472b6' : '#21262d',
                    color: feedForm.type === t.id ? '#fff' : '#8b949e',
                    fontSize: 12, fontWeight: 600, fontFamily: 'Heebo'
                  }}>{t.icon} {t.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>שעה</label>
                <input type="time" value={feedForm.time} onChange={e => setFF('time', e.target.value)} style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                {feedForm.type !== 'breast'
                  ? <><label style={lbl}>כמות (מ"ל)</label><input type="number" value={feedForm.amount} onChange={e => setFF('amount', e.target.value)} placeholder="120" style={inp()} /></>
                  : <><label style={lbl}>משך (דקות)</label><input type="number" value={feedForm.duration} onChange={e => setFF('duration', e.target.value)} placeholder="15" style={inp()} /></>
                }
              </div>
            </div>
            <div>
              <label style={lbl}>הערות</label>
              <input value={feedForm.notes} onChange={e => setFF('notes', e.target.value)} placeholder="הערות..." style={inp()} />
            </div>
            {feedForm.amount && dailyTarget && (
              <div style={{ background: '#f472b615', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f9a8d4' }}>
                מנה זו = {Math.round((Number(feedForm.amount) / dailyTarget) * 100)}% מהיעד היומי ({dailyTarget} מ"ל)
              </div>
            )}
            <button onClick={addFeed} style={primaryBtn('#f472b6')}>✅ שמור האכלה</button>
          </div>
        </Modal>
      )}

      {/* ── SLEEP MODAL ── */}
      {sleepModal && (
        <Modal title="😴 רישום שינה" onClose={() => setSleepModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>שעת התחלה</label>
                <input type="time" value={sleepForm.startTime} onChange={e => setSF('startTime', e.target.value)} style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>שעת סיום</label>
                <input type="time" value={sleepForm.endTime} onChange={e => setSF('endTime', e.target.value)} style={inp()} />
              </div>
            </div>
            {sleepForm.startTime && sleepForm.endTime && (() => {
              const [sh, sm] = sleepForm.startTime.split(':').map(Number)
              const [eh, em] = sleepForm.endTime.split(':').map(Number)
              let m = (eh * 60 + em) - (sh * 60 + sm)
              if (m < 0) m += 24 * 60
              return m > 0 ? (
                <div style={{ background: '#60a5fa15', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#93c5fd' }}>
                  משך השינה: {Math.floor(m/60)}ש' {m%60}דק'
                </div>
              ) : null
            })()}
            <div>
              <label style={lbl}>הערות</label>
              <input value={sleepForm.notes} onChange={e => setSF('notes', e.target.value)} placeholder="הערות..." style={inp()} />
            </div>
            <button onClick={addSleep} disabled={!sleepForm.startTime} style={{ ...primaryBtn('#60a5fa'), opacity: !sleepForm.startTime ? 0.5 : 1 }}>✅ שמור שינה</button>
          </div>
        </Modal>
      )}

      {/* ── TEMPERATURE MODAL ── */}
      {tempModal && (
        <Modal title="🌡️ מדידת חום" onClose={() => setTempModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 2 }}>
                <label style={lbl}>טמפרטורה (°C)</label>
                <input type="number" step="0.1" value={tempForm.value} onChange={e => setTF('value', e.target.value)} placeholder="37.0" style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>שעה</label>
                <input type="time" value={tempForm.time} onChange={e => setTF('time', e.target.value)} style={inp()} />
              </div>
            </div>
            {tempForm.value && (() => {
              const val = parseFloat(tempForm.value)
              const color = val >= 39 ? '#ef4444' : val >= 38.5 ? '#f97316' : val >= 38 ? '#f59e0b' : '#22c55e'
              const msg = val >= 39 ? '🚨 קדחת גבוהה – פנה לרופא!' : val >= 38.5 ? '⚠️ קדחת – מומלץ להתייעץ עם רופא' : val >= 38 ? '⚠️ קדחת נמוכה' : '✅ תקין'
              return <div style={{ background: color + '18', borderRadius: 8, padding: '8px 12px', fontSize: 12, color, fontWeight: 700 }}>{msg}</div>
            })()}
            <div>
              <label style={lbl}>הערות</label>
              <input value={tempForm.notes} onChange={e => setTF('notes', e.target.value)} placeholder="תסמינים, תרופה שניתנה..." style={inp()} />
            </div>
            <button onClick={addTemp} disabled={!tempForm.value} style={{ ...primaryBtn('#f87171'), opacity: !tempForm.value ? 0.5 : 1 }}>✅ שמור מדידה</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl', fontFamily: 'Heebo' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '8px 0' }}>{text}</p>
}

const rowCard = () => ({
  display: 'flex', alignItems: 'center', gap: 10,
  background: '#161b22', border: '1px solid #30363d',
  borderRadius: 10, padding: '10px 12px', marginBottom: 6
})
const actionBtn = (color) => ({
  background: color + '18', color, border: `1px solid ${color}44`,
  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700,
  fontFamily: 'Heebo', cursor: 'pointer', marginBottom: 8,
  width: '100%', textAlign: 'center', display: 'block'
})
const delBtn = () => ({
  background: 'none', border: 'none', color: '#6b7280',
  cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: '2px 4px'
})
const primaryBtn = (color) => ({
  background: color, color: '#fff', border: 'none', borderRadius: 10,
  padding: '13px', fontSize: 15, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer', marginTop: 4
})
const badge = (color) => ({
  background: color + '22', color, borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 700
})
const lbl = { display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 4, fontFamily: 'Heebo' }
const inp = () => ({
  width: '100%', background: '#21262d', border: '1px solid #30363d',
  borderRadius: 8, padding: '9px 10px', color: '#e6edf3',
  fontSize: 14, fontFamily: 'Heebo', outline: 'none', direction: 'rtl', boxSizing: 'border-box'
})
