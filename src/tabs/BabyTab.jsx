import { useState } from 'react'
import { uid, todayKey } from '../utils'

function timeNow() { return new Date().toTimeString().slice(0, 5) }

const VITAMIN_DEFAULTS = [
  { name: 'ויטמין D', dose: '400 יח\'', icon: '☀️' },
  { name: 'ברזל', dose: '1 מ"ג/ק"ג', icon: '🩸' },
  { name: 'פרוביוטיקה', dose: 'לפי הוראה', icon: '🦠' },
]

const FOOD_TYPES = [
  { id: 'breast', label: 'חלב אם', icon: '🤱' },
  { id: 'formula_materna', label: 'מטרנה', icon: '🍼' },
  { id: 'formula_nutri', label: 'נוטריילון', icon: '🍼' },
  { id: 'formula_other', label: 'פורמולה אחרת', icon: '🍼' },
  { id: 'solid', label: 'מוצקים', icon: '🥣' },
]

export default function BabyTab({ data, update, profileName, profile }) {
  const today = todayKey()
  const babyLog = (data.babyLog || []).filter(l => l.profileId === data.activeProfile && l.date === today)

  const [feedModal, setFeedModal] = useState(false)
  const [feedForm, setFeedForm] = useState({ type: 'breast', amount: '', duration: '', time: timeNow(), notes: '' })

  const [diaperModal, setDiaperModal] = useState(false)

  // Feeding log
  const feeds = babyLog.filter(l => l.type === 'feed')
  const diapers = babyLog.filter(l => l.type === 'diaper')
  const vitamins = babyLog.filter(l => l.type === 'vitamin')

  const addFeed = () => {
    update(d => ({ ...d, babyLog: [...(d.babyLog || []), { id: uid(), profileId: d.activeProfile, date: today, type: 'feed', ...feedForm }] }))
    setFeedModal(false)
  }

  const addDiaper = (kind) => {
    update(d => ({ ...d, babyLog: [...(d.babyLog || []), { id: uid(), profileId: d.activeProfile, date: today, type: 'diaper', kind, time: timeNow() }] }))
  }

  const toggleVitamin = (name) => {
    const exists = vitamins.find(v => v.name === name)
    if (exists) {
      update(d => ({ ...d, babyLog: (d.babyLog || []).filter(l => l.id !== exists.id) }))
    } else {
      update(d => ({ ...d, babyLog: [...(d.babyLog || []), { id: uid(), profileId: d.activeProfile, date: today, type: 'vitamin', name, time: timeNow() }] }))
    }
  }

  const deleteLog = (id) => update(d => ({ ...d, babyLog: (d.babyLog || []).filter(l => l.id !== id) }))

  // Age in months
  const ageMonths = profile?.birthDate ? Math.floor((new Date() - new Date(profile.birthDate)) / (1000 * 60 * 60 * 24 * 30)) : null

  return (
    <div>
      {/* Baby header */}
      <div style={{ background: 'linear-gradient(135deg,#f472b622,#fb923c22)', border: '1px solid #f472b633', borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 40 }}>{profile?.avatar || '👶'}</span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9a8d4' }}>{profileName}</h2>
            {ageMonths !== null && (
              <p style={{ fontSize: 13, color: '#8b949e', marginTop: 2 }}>
                {ageMonths < 1 ? 'פחות מחודש' : ageMonths === 1 ? 'חודש אחד' : `${ageMonths} חודשים`}
              </p>
            )}
            <p style={{ fontSize: 12, color: '#8b949e', marginTop: 1 }}>כל מה שצריך לעקוב – במקום אחד 💕</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'האכלות', value: feeds.length, icon: '🍼', color: '#f472b6' },
          { label: 'חיתולים', value: diapers.length, icon: '🌸', color: '#fb923c' },
          { label: 'ויטמינים', value: vitamins.length, icon: '☀️', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161b22', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label} היום</div>
          </div>
        ))}
      </div>

      {/* ── FEEDING ── */}
      <Section title="🍼 האכלה" color="#f472b6">
        <button onClick={() => setFeedModal(true)} style={addBtn('#f472b6')}>+ רשום האכלה</button>
        {feeds.length === 0
          ? <EmptyState text="אין האכלות מתועדות היום" />
          : feeds.map(f => (
            <div key={f.id} style={logCard('#f472b633')}>
              <span style={{ fontSize: 18 }}>{FOOD_TYPES.find(t => t.id === f.type)?.icon || '🍼'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{FOOD_TYPES.find(t => t.id === f.type)?.label}</div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>
                  {f.time}{f.amount ? ` · ${f.amount} מ"ל` : ''}{f.duration ? ` · ${f.duration} דקות` : ''}
                </div>
                {f.notes && <div style={{ fontSize: 11, color: '#6b7280' }}>{f.notes}</div>}
              </div>
              <button onClick={() => deleteLog(f.id)} style={delBtn()}>✕</button>
            </div>
          ))}
      </Section>

      {/* ── DIAPERS ── */}
      <Section title="🌸 חיתולים" color="#fb923c">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => addDiaper('pee')} style={{ ...addBtn('#60a5fa'), flex: 1, fontSize: 15 }}>💧 פיפי</button>
          <button onClick={() => addDiaper('poop')} style={{ ...addBtn('#fb923c'), flex: 1, fontSize: 15 }}>💩 קקי</button>
          <button onClick={() => addDiaper('both')} style={{ ...addBtn('#a78bfa'), flex: 1, fontSize: 15 }}>💧💩 שניהם</button>
        </div>
        {diapers.length === 0
          ? <EmptyState text="אין חיתולים מתועדים היום" />
          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {diapers.map(d => (
              <div key={d.id} style={{ background: '#21262d', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{d.kind === 'pee' ? '💧' : d.kind === 'poop' ? '💩' : '💧💩'}</span>
                <span style={{ fontSize: 12, color: '#8b949e' }}>{d.time}</span>
                <button onClick={() => deleteLog(d.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
        }
      </Section>

      {/* ── VITAMINS ── */}
      <Section title="☀️ ויטמינים ותוספים" color="#fbbf24">
        {VITAMIN_DEFAULTS.map(v => {
          const taken = vitamins.some(x => x.name === v.name)
          return (
            <div key={v.name} style={{ ...logCard(taken ? '#fbbf2433' : '#21262d'), border: `1px solid ${taken ? '#fbbf2466' : '#30363d'}`, opacity: taken ? 0.8 : 1 }}>
              <span style={{ fontSize: 20 }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>{v.dose}</div>
              </div>
              <button onClick={() => toggleVitamin(v.name)} style={{
                borderRadius: 8, border: 'none', cursor: 'pointer', padding: '6px 12px',
                background: taken ? '#238636' : '#388bfd', color: '#fff',
                fontSize: 12, fontWeight: 700, fontFamily: 'Heebo'
              }}>
                {taken ? '✓ ניתן' : 'ניתן'}
              </button>
            </div>
          )
        })}

        {/* Custom med vitamins */}
        {data.meds.filter(m => m.profileId === data.activeProfile).map(med => {
          const taken = vitamins.some(x => x.name === med.name)
          return (
            <div key={med.id} style={{ ...logCard(taken ? '#22c55e22' : '#21262d'), border: `1px solid ${taken ? '#22c55e44' : '#30363d'}` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.color || '#58a6ff', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{med.name}</div>
                {med.dose && <div style={{ fontSize: 12, color: '#8b949e' }}>{med.dose}</div>}
              </div>
              <button onClick={() => toggleVitamin(med.name)} style={{
                borderRadius: 8, border: 'none', cursor: 'pointer', padding: '6px 12px',
                background: taken ? '#238636' : '#388bfd', color: '#fff',
                fontSize: 12, fontWeight: 700, fontFamily: 'Heebo'
              }}>
                {taken ? '✓ ניתן' : 'ניתן'}
              </button>
            </div>
          )
        })}
      </Section>

      {/* Feed modal */}
      {feedModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setFeedModal(false)}>
          <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🍼 רישום האכלה</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>סוג האכלה</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {FOOD_TYPES.map(t => (
                    <button key={t.id} onClick={() => setFeedForm(f => ({ ...f, type: t.id }))} style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: feedForm.type === t.id ? '#f472b6' : '#21262d',
                      color: feedForm.type === t.id ? '#fff' : '#8b949e',
                      fontSize: 12, fontWeight: 600, fontFamily: 'Heebo'
                    }}>{t.icon} {t.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>שעה</label>
                  <input type="time" value={feedForm.time} onChange={e => setFeedForm(f => ({ ...f, time: e.target.value }))}
                    style={{ width: '100%', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px', color: '#e6edf3', fontSize: 14, fontFamily: 'Heebo' }} />
                </div>
                {feedForm.type !== 'breast' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>כמות (מ"ל)</label>
                    <input type="number" value={feedForm.amount} onChange={e => setFeedForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="120" style={{ width: '100%', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px', color: '#e6edf3', fontSize: 14, fontFamily: 'Heebo' }} />
                  </div>
                )}
                {feedForm.type === 'breast' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>משך (דקות)</label>
                    <input type="number" value={feedForm.duration} onChange={e => setFeedForm(f => ({ ...f, duration: e.target.value }))}
                      placeholder="15" style={{ width: '100%', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px', color: '#e6edf3', fontSize: 14, fontFamily: 'Heebo' }} />
                  </div>
                )}
              </div>
              <input value={feedForm.notes} onChange={e => setFeedForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="הערות..." style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', fontSize: 14, fontFamily: 'Heebo' }} />
              <button onClick={addFeed} style={{ background: '#f472b6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer' }}>
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
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 18, background: color, borderRadius: 2 }} />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '12px 0' }}>{text}</p>
}

const logCard = (bg) => ({
  background: bg, borderRadius: 10, padding: '10px 12px', marginBottom: 8,
  display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #30363d'
})

const addBtn = (color) => ({
  background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 8,
  padding: '8px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'Heebo',
  cursor: 'pointer', marginBottom: 10, display: 'block'
})

const delBtn = () => ({
  background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, flexShrink: 0
})
