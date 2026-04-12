import { useState } from 'react'
import DateNavigator, { useDateNav } from '../components/DateNavigator'
import * as db from '../db'

const KINDS = [
  { id: 'pee',  label: 'פיפי',         icon: '💧', color: '#60a5fa' },
  { id: 'poop', label: 'קקי',          icon: '💩', color: '#fb923c' },
  { id: 'both', label: 'פיפי + קקי',   icon: '💧💩', color: '#a78bfa' },
]

export default function DiapersTab({ data, reload, family, activeBaby, themeColor = '#fb923c' }) {
  const { dateKey, dateLabel, isToday, goBack, goForward } = useDateNav()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ kind: 'pee', time: now(), notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const diapers = (data.babyLog || []).filter(l => l.baby_id === activeBaby?.id && l.date === dateKey && l.type === 'diaper')

  const peeCount  = diapers.filter(d => d.kind === 'pee'  || d.kind === 'both').length
  const poopCount = diapers.filter(d => d.kind === 'poop' || d.kind === 'both').length

  const handleSave = async () => {
    if (!activeBaby || !family) return
    setSaving(true)
    await db.addLog(family.id, activeBaby.id, {
      type: 'diaper',
      date: dateKey,
      time: form.time,
      kind: form.kind,
      notes: form.notes || null,
    })
    await reload()
    setShowForm(false)
    setForm({ kind: 'pee', time: now(), notes: '' })
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await db.deleteLog(id)
    await reload()
    setDeleting(null)
  }

  // Quick-add buttons
  const quickAdd = async (kind) => {
    if (!activeBaby || !family) return
    await db.addLog(family.id, activeBaby.id, {
      type: 'diaper', date: dateKey, time: now(), kind
    })
    await reload()
  }

  if (!activeBaby) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      <DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color={themeColor} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <StatPill label="סה״כ" value={diapers.length} color="#fb923c" />
        <StatPill label="💧 פיפי" value={peeCount} color="#60a5fa" />
        <StatPill label="💩 קקי" value={poopCount} color="#fb923c" />
      </div>

      {/* Quick add row */}
      {isToday && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {KINDS.map(k => (
            <button key={k.id} onClick={() => quickAdd(k.id)} style={{
              padding: '14px 0', background: k.color + '18',
              border: `1px solid ${k.color}40`, borderRadius: 14,
              fontFamily: 'Heebo', fontSize: 13, fontWeight: 700,
              color: k.color, cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 4
            }}>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>
      )}

      {/* Manual add */}
      <button onClick={() => setShowForm(v => !v)} style={{
        width: '100%', padding: '11px 0', marginBottom: 14,
        background: showForm ? '#21262d' : 'transparent',
        color: showForm ? '#8b949e' : '#fb923c',
        border: `1px solid ${showForm ? '#30363d' : '#fb923c40'}`,
        borderRadius: 12, fontFamily: 'Heebo', fontSize: 13, fontWeight: 600, cursor: 'pointer'
      }}>
        {showForm ? '✕ ביטול' : '+ הוספה ידנית עם שעה'}
      </button>

      {showForm && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>סוג חיתול</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {KINDS.map(k => (
                <button key={k.id} onClick={() => setForm(f => ({ ...f, kind: k.id }))} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1px solid ${form.kind === k.id ? k.color : '#30363d'}`,
                  background: form.kind === k.id ? k.color + '22' : '#21262d',
                  color: form.kind === k.id ? k.color : '#8b949e',
                  fontFamily: 'Heebo', fontSize: 12, cursor: 'pointer'
                }}>{k.icon} {k.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>שעה</div>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '12px 0', background: saving ? '#4b2200' : '#fb923c',
            color: '#fff', border: 'none', borderRadius: 10,
            fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer'
          }}>
            {saving ? '...' : 'שמור'}
          </button>
        </div>
      )}

      {/* Diaper list */}
      {diapers.length > 0 ? (
        <div>
          {[...diapers].reverse().map(d => {
            const k = KINDS.find(k => k.id === d.kind) || KINDS[0]
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
                padding: '12px 14px', marginBottom: 8
              }}>
                <span style={{ fontSize: 22 }}>{k.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{k.label}</div>
                </div>
                <span style={{ fontSize: 12, color: '#58a6ff' }}>{d.time}</span>
                <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} style={{
                  background: '#ef444418', border: 'none', borderRadius: 8,
                  width: 28, height: 28, cursor: 'pointer', color: '#ef4444', fontSize: 14
                }}>✕</button>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌸</div>
          <div style={{ fontSize: 14 }}>{isToday ? 'עוד לא תיעדנו חיתול היום' : 'לא תועד כלום ביום הזה'}</div>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: '#161b22', border: `1px solid ${color}33`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
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
