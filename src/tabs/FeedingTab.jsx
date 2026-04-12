import { useState } from 'react'
import DateNavigator, { useDateNav } from '../components/DateNavigator'
import * as db from '../db'

const FOOD_TYPES = [
  { id: 'breast',          label: 'חלב אם',      icon: '🤱', color: '#f9a8d4' },
  { id: 'formula_materna', label: 'מטרנה',        icon: '🍼', color: '#60a5fa' },
  { id: 'formula_nutri',   label: 'נוטריילון',    icon: '🍼', color: '#60a5fa' },
  { id: 'formula_other',   label: 'פורמולה אחרת', icon: '🍼', color: '#60a5fa' },
  { id: 'solid',           label: 'מוצקים',       icon: '🥣', color: '#fb923c' },
]

export default function FeedingTab({ data, reload, family, activeBaby, themeColor = '#a78bfa' }) {
  const { dateKey, dateLabel, isToday, goBack, goForward } = useDateNav()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ food_type: 'formula_materna', amount: '', duration: '', time: now(), notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const feeds = (data.babyLog || []).filter(l => l.baby_id === activeBaby?.id && l.date === dateKey && l.type === 'feed')

  // Stats
  const totalMl = feeds.filter(f => f.food_type !== 'breast' && f.amount).reduce((s, f) => s + parseFloat(f.amount), 0)
  const totalBreastMin = feeds.filter(f => f.food_type === 'breast').reduce((s, f) => s + Number(f.duration || 0), 0)
  const weightKg = activeBaby?.weight ? parseFloat(activeBaby.weight) : null
  const dailyTarget = weightKg ? Math.round(weightKg * 150) : null
  const feedsPerDay = activeBaby?.feeds_per_day || feeds.length || 8

  // ml per feed calc
  const bottleFeeds = feeds.filter(f => f.food_type !== 'breast' && f.amount)
  const avgMlPerFeed = bottleFeeds.length > 0 ? Math.round(totalMl / bottleFeeds.length) : null
  const recommendedMlPerFeed = dailyTarget ? Math.round(dailyTarget / feedsPerDay) : null

  const [validationError, setValidationError] = useState('')

  const handleSave = async () => {
    setValidationError('')
    if (!activeBaby || !family) return
    if (form.food_type === 'breast' && !form.duration) {
      setValidationError('נא להכניס משך האכלה בדקות')
      return
    }
    if (form.food_type !== 'breast' && !form.amount) {
      setValidationError('נא להכניס כמות במ"ל')
      return
    }
    if (form.food_type !== 'breast' && parseFloat(form.amount) <= 0) {
      setValidationError('הכמות חייבת להיות גדולה מ-0')
      return
    }
    setSaving(true)
    await db.addLog(family.id, activeBaby.id, {
      type: 'feed',
      date: dateKey,
      time: form.time,
      food_type: form.food_type,
      amount: form.food_type !== 'breast' && form.amount ? parseFloat(form.amount) : null,
      duration: form.food_type === 'breast' && form.duration ? parseInt(form.duration) : null,
      notes: form.notes || null,
    })
    await reload()
    setShowForm(false)
    setForm({ food_type: 'formula_materna', amount: '', duration: '', time: now(), notes: '' })
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await db.deleteLog(id)
    await reload()
    setDeleting(null)
  }

  if (!activeBaby) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      <DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color={themeColor} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <StatPill label="האכלות" value={feeds.length} color={themeColor} />
        <StatPill label='סה"כ מ"ל' value={totalMl > 0 ? `${Math.round(totalMl)}` : totalBreastMin > 0 ? `${totalBreastMin}ד'` : '—'} color="#60a5fa" />
        <StatPill label="יעד יומי" value={dailyTarget ? `${dailyTarget}` : '—'} sub='מ"ל' color="#22c55e" />
      </div>

      {/* ml per feed calculator */}
      {(recommendedMlPerFeed || avgMlPerFeed) && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>🧮 מחשבון האכלה</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {recommendedMlPerFeed && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>מומלץ להאכלה</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{recommendedMlPerFeed} <span style={{ fontSize: 12 }}>מ"ל</span></div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>משקל × 150 ÷ {feedsPerDay} האכלות/יום</div>
              </div>
            )}
            {avgMlPerFeed && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>ממוצע בפועל</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>{avgMlPerFeed} <span style={{ fontSize: 12 }}>מ"ל</span></div>
              </div>
            )}
          </div>
          {dailyTarget && totalMl > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8b949e', marginBottom: 4 }}>
                <span>התקדמות יומית</span>
                <span>{totalMl} / {dailyTarget} מ"ל</span>
              </div>
              <div style={{ background: '#30363d', borderRadius: 4, height: 6 }}>
                <div style={{
                  background: totalMl >= dailyTarget ? '#22c55e' : themeColor,
                  height: 6, borderRadius: 4,
                  width: `${Math.min(100, Math.round(totalMl / dailyTarget * 100))}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      <button onClick={() => setShowForm(v => !v)} style={{
        width: '100%', padding: '13px 0', marginBottom: 14,
        background: showForm ? '#21262d' : themeColor,
        color: showForm ? '#8b949e' : '#fff',
        border: `1px solid ${showForm ? '#30363d' : themeColor}`,
        borderRadius: 12, fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: 'pointer'
      }}>
        {showForm ? '✕ ביטול' : '+ הוסף האכלה'}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          {/* Food type */}
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>סוג אוכל</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FOOD_TYPES.map(ft => (
                <button key={ft.id} onClick={() => { setForm(f => ({ ...f, food_type: ft.id, amount: '', duration: '' })); setValidationError('') }} style={{
                  padding: '7px 12px', borderRadius: 10, border: `1px solid ${form.food_type === ft.id ? ft.color : '#30363d'}`,
                  background: form.food_type === ft.id ? ft.color + '22' : '#21262d',
                  color: form.food_type === ft.id ? ft.color : '#8b949e',
                  fontFamily: 'Heebo', fontSize: 13, cursor: 'pointer'
                }}>{ft.icon} {ft.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {form.food_type !== 'breast' && (
              <div>
                <div style={labelStyle}>כמות (מ"ל)</div>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="120" style={inputStyle} />
              </div>
            )}
            {form.food_type === 'breast' && (
              <div>
                <div style={labelStyle}>משך (דקות)</div>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="15" style={inputStyle} />
              </div>
            )}
            <div>
              <div style={labelStyle}>שעה</div>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>

          {validationError && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#ef4444', marginBottom: 10 }}>
              {validationError}
            </div>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '12px 0', background: saving ? '#2d1f4a' : themeColor,
            color: '#fff', border: 'none', borderRadius: 10,
            fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer'
          }}>
            {saving ? '...' : 'שמור'}
          </button>
        </div>
      )}

      {/* Feed list */}
      {feeds.length > 0 ? (
        <div>
          {[...feeds].reverse().map(f => {
            const ft = FOOD_TYPES.find(t => t.id === f.food_type) || FOOD_TYPES[0]
            return (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
                padding: '12px 14px', marginBottom: 8
              }}>
                <span style={{ fontSize: 22 }}>{ft.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{ft.label}</div>
                  {f.duration && <div style={{ fontSize: 12, color: '#8b949e' }}>{f.duration} דק'</div>}
                </div>
                {f.amount && (
                  <span style={{
                    background: themeColor + '22', color: themeColor, borderRadius: 8,
                    padding: '4px 10px', fontSize: 13, fontWeight: 800
                  }}>{parseFloat(f.amount)} מ"ל</span>
                )}
                <span style={{ fontSize: 12, color: '#58a6ff' }}>{f.time}</span>
                <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id} style={{
                  background: '#ef444418', border: 'none', borderRadius: 8,
                  width: 28, height: 28, cursor: 'pointer', color: '#ef4444', fontSize: 14
                }}>✕</button>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍼</div>
          <div style={{ fontSize: 14 }}>{isToday ? 'עוד לא תיעדנו האכלה היום' : 'לא תועד כלום ביום הזה'}</div>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, sub, color }) {
  return (
    <div style={{ background: '#161b22', border: `1px solid ${color}33`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}{sub && <span style={{ fontSize: 11 }}> {sub}</span>}</div>
    </div>
  )
}

const now = () => new Date().toTimeString().slice(0, 5)
const labelStyle = { fontSize: 12, color: '#8b949e', marginBottom: 6, fontWeight: 600, display: 'block' }
const inputStyle = {
  width: '100%', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 10, padding: '10px 12px', color: '#e6edf3',
  fontFamily: 'Heebo', fontSize: 14, outline: 'none', boxSizing: 'border-box'
}
