import { useState } from 'react'
import { uid, todayKey } from '../utils'
import DateNavigator, { useDateNav } from '../components/DateNavigator'

function timeNow() { return new Date().toTimeString().slice(0, 5) }

const VITAMIN_DEFAULTS = [
  { name: 'ויטמין D', dose: "400 יח'", icon: '☀️' },
  { name: 'ברזל', dose: '1 מ"ג/ק"ג', icon: '🩸' },
  { name: 'פרוביוטיקה', dose: 'לפי הוראה', icon: '🦠' },
]

const FOOD_TYPES = [
  { id: 'breast',          label: 'חלב אם',       icon: '🤱' },
  { id: 'formula_materna', label: 'מטרנה',        icon: '🍼' },
  { id: 'formula_nutri',   label: 'נוטריילון',    icon: '🍼' },
  { id: 'formula_other',   label: 'פורמולה אחרת', icon: '🍼' },
  { id: 'solid',           label: 'מוצקים',       icon: '🥣' },
]

const DIAPER_LABELS = { pee: '💧 פיפי', poop: '💩 קקי', both: '💧💩 שניהם' }

export default function BabyTab({ data, update, profileName, profile, babyLog: babyLogProp }) {
  const { dateKey, dateLabel, isToday, goBack, goForward } = useDateNav()

  // Always read from prop (reactive) with fallback to data
  const allBabyLog = babyLogProp || data.babyLog || []
  const dayLog = allBabyLog.filter(l => l.profileId === data.activeProfile && l.date === dateKey)

  const feeds   = dayLog.filter(l => l.type === 'feed').sort((a,b) => a.time > b.time ? -1 : 1)
  const diapers = dayLog.filter(l => l.type === 'diaper').sort((a,b) => a.time > b.time ? -1 : 1)
  const vitamins = dayLog.filter(l => l.type === 'vitamin')

  const [feedModal, setFeedModal] = useState(false)
  const [feedForm, setFeedForm] = useState({ type: 'breast', amount: '', duration: '', time: timeNow(), notes: '' })
  const setFF = (k, v) => setFeedForm(f => ({ ...f, [k]: v }))

  const addFeed = () => {
    const entry = { id: uid(), profileId: data.activeProfile, date: dateKey, type: 'feed', ...feedForm }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
    setFeedModal(false)
    setFeedForm({ type: 'breast', amount: '', duration: '', time: timeNow(), notes: '' })
  }

  const addDiaper = (kind) => {
    const entry = { id: uid(), profileId: data.activeProfile, date: dateKey, type: 'diaper', kind, time: timeNow() }
    update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
  }

  const toggleVitamin = (name) => {
    const exists = vitamins.find(v => v.name === name)
    if (exists) {
      update(prev => ({ ...prev, babyLog: (prev.babyLog || []).filter(l => l.id !== exists.id) }))
    } else {
      const entry = { id: uid(), profileId: data.activeProfile, date: dateKey, type: 'vitamin', name, time: timeNow() }
      update(prev => ({ ...prev, babyLog: [...(prev.babyLog || []), entry] }))
    }
  }

  const deleteLog = (id) => update(prev => ({ ...prev, babyLog: (prev.babyLog || []).filter(l => l.id !== id) }))

  const ageMonths = profile?.birthDate
    ? Math.floor((new Date() - new Date(profile.birthDate)) / (1000 * 60 * 60 * 24 * 30))
    : null

  return (
    <div>
      {/* Baby header – compact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 32 }}>{profile?.avatar || '👶'}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f9a8d4' }}>{profileName}</div>
          {ageMonths !== null && (
            <div style={{ fontSize: 12, color: '#8b949e' }}>
              {ageMonths < 1 ? 'פחות מחודש' : `${ageMonths} חודשים`}
            </div>
          )}
        </div>
      </div>

      {/* Date navigator */}
      <DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color="#f472b6" />

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'האכלות', value: feeds.length,   icon: '🍼', color: '#f472b6' },
          { label: 'חיתולים', value: diapers.length, icon: '🌸', color: '#fb923c' },
          { label: 'ויטמינים', value: vitamins.length, icon: '☀️', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161b22', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
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
            <div style={{ maxHeight: feeds.length > 10 ? 340 : 'none', overflowY: feeds.length > 10 ? 'auto' : 'visible' }}>
              {feeds.map(f => (
                <div key={f.id} style={rowCard()}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{FOOD_TYPES.find(t => t.id === f.type)?.icon || '🍼'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{FOOD_TYPES.find(t => t.id === f.type)?.label}</div>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>
                      {f.amount ? `${f.amount} מ"ל` : ''}{f.duration ? ` · ${f.duration} דק'` : ''}{f.notes ? ` · ${f.notes}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#58a6ff', fontWeight: 700, flexShrink: 0 }}>{f.time}</span>
                  {isToday && <button onClick={() => deleteLog(f.id)} style={delBtn()}>✕</button>}
                </div>
              ))}
            </div>
          )
        }
      </Section>

      {/* ── DIAPERS ── */}
      <Section title="🌸 חיתולים" color="#fb923c">
        {isToday && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => addDiaper('pee')}  style={{ ...actionBtn('#60a5fa'), flex: 1 }}>💧 פיפי</button>
            <button onClick={() => addDiaper('poop')} style={{ ...actionBtn('#fb923c'), flex: 1 }}>💩 קקי</button>
            <button onClick={() => addDiaper('both')} style={{ ...actionBtn('#a78bfa'), flex: 1 }}>שניהם</button>
          </div>
        )}
        {diapers.length === 0
          ? <EmptyState text={isToday ? 'אין חיתולים מתועדים' : 'אין חיתולים ביום זה'} />
          : (
            <div style={{ maxHeight: diapers.length > 10 ? 320 : 'none', overflowY: diapers.length > 10 ? 'auto' : 'visible' }}>
              {diapers.map(d => (
                <div key={d.id} style={rowCard()}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {d.kind === 'pee' ? '💧' : d.kind === 'poop' ? '💩' : '💧💩'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{DIAPER_LABELS[d.kind]}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#58a6ff', fontWeight: 700, flexShrink: 0 }}>{d.time}</span>
                  {isToday && <button onClick={() => deleteLog(d.id)} style={delBtn()}>✕</button>}
                </div>
              ))}
            </div>
          )
        }
      </Section>

      {/* ── VITAMINS ── */}
      <Section title="☀️ ויטמינים ותוספים" color="#fbbf24">
        {[...VITAMIN_DEFAULTS, ...data.meds.filter(m => m.profileId === data.activeProfile).map(m => ({ name: m.name, dose: m.dose, icon: '💊' }))].map(v => {
          const taken = vitamins.some(x => x.name === v.name)
          return (
            <div key={v.name} style={{ ...rowCard(), background: taken ? '#fbbf2410' : '#161b22', border: `1px solid ${taken ? '#fbbf2440' : '#30363d'}` }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                {v.dose && <div style={{ fontSize: 11, color: '#8b949e' }}>{v.dose}</div>}
              </div>
              {isToday
                ? <button onClick={() => toggleVitamin(v.name)} style={{
                    borderRadius: 8, border: 'none', cursor: 'pointer', padding: '5px 12px',
                    background: taken ? '#238636' : '#388bfd', color: '#fff',
                    fontSize: 12, fontWeight: 700, fontFamily: 'Heebo', flexShrink: 0
                  }}>{taken ? '✓ ניתן' : 'ניתן'}</button>
                : <span style={{ fontSize: 12, color: taken ? '#22c55e' : '#6b7280', fontWeight: 700 }}>{taken ? '✓' : '—'}</span>
              }
            </div>
          )
        })}
      </Section>

      {/* ── FEED MODAL ── */}
      {feedModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setFeedModal(false)}>
          <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>🍼 רישום האכלה</h3>
              <button onClick={() => setFeedModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Food type */}
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
              {/* Time + amount/duration */}
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
              {/* Notes */}
              <div>
                <label style={lbl}>הערות</label>
                <input value={feedForm.notes} onChange={e => setFF('notes', e.target.value)} placeholder="הערות..." style={inp()} />
              </div>
              {/* Save */}
              <button onClick={addFeed} style={{
                background: '#f472b6', color: '#fff', border: 'none', borderRadius: 10,
                padding: '13px', fontSize: 15, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer', marginTop: 4
              }}>
                ✅ שמור האכלה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{title}</h3>
      </div>
      {children}
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

const lbl = { display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 4, fontFamily: 'Heebo' }
const inp = () => ({
  width: '100%', background: '#21262d', border: '1px solid #30363d',
  borderRadius: 8, padding: '9px 10px', color: '#e6edf3',
  fontSize: 14, fontFamily: 'Heebo', outline: 'none', direction: 'rtl'
})
