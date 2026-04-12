import { useState } from 'react'
import { TIPAT_CHALAV_VISITS } from '../data/vaccineSchedule'
import { ageInMonths } from '../utils'
import * as db from '../db'

const STATUS_META = {
  completed: { label: 'בוצע',   color: '#22c55e', icon: '✅' },
  pending:   { label: 'ממתין',  color: '#60a5fa', icon: '⏳' },
  overdue:   { label: 'באיחור', color: '#ef4444', icon: '⚠️' },
  skipped:   { label: 'דולג',   color: '#8b949e', icon: '⏭️' },
}

const VIEWS = [
  { id: 'upcoming',  label: 'הבא',       icon: '📅' },
  { id: 'all',       label: 'הכל',       icon: '📋' },
  { id: 'completed', label: 'בוצעו',     icon: '✅' },
  { id: 'tipat',     label: 'טיפת חלב',  icon: '🏥' },
]

export default function VaccinationsTab({ data, reload, family, activeBaby, themeColor = '#a78bfa' }) {
  const [view, setView] = useState('upcoming')
  const [selectedVaccine, setSelectedVaccine] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const babyId = activeBaby?.id
  const allVaccinations = (data.vaccinations || []).filter(v => v.baby_id === babyId)

  const filtered = allVaccinations.filter(v => {
    if (view === 'upcoming')  return v.status === 'pending' || v.status === 'overdue'
    if (view === 'completed') return v.status === 'completed'
    return true
  }).sort((a, b) => a.scheduled_date > b.scheduled_date ? 1 : -1)

  const overdueCount   = allVaccinations.filter(v => v.status === 'overdue').length
  const completedCount = allVaccinations.filter(v => v.status === 'completed').length
  const upcomingCount  = allVaccinations.filter(v => v.status === 'pending').length

  // Tipat Chalav
  const months = ageInMonths(activeBaby?.birth_date)
  const birth = activeBaby?.birth_date ? new Date(activeBaby.birth_date) : null
  const tipatVisits = birth ? TIPAT_CHALAV_VISITS.map(v => {
    const visitDate = new Date(birth)
    visitDate.setDate(visitDate.getDate() + Math.round(v.ageMonths * 30.44))
    const days = Math.ceil((visitDate - new Date()) / (1000 * 60 * 60 * 24))
    return { ...v, visitDate: visitDate.toISOString().slice(0, 10), days }
  }) : []

  const markDone = async (vaccineId, formData) => {
    setSaving(true)
    await db.updateVaccination(vaccineId, {
      status: 'completed',
      actual_date: formData.actual_date || new Date().toISOString().slice(0, 10),
      clinic: formData.clinic || null,
      doctor: formData.doctor || null,
      batch_number: formData.batch_number || null,
      side_effects: formData.side_effects || null,
    })
    await reload()
    setSelectedVaccine(null)
    setEditForm(null)
    setSaving(false)
  }

  const markSkipped = async (vaccineId) => {
    await db.updateVaccination(vaccineId, { status: 'skipped' })
    await reload()
  }

  const unmark = async (vaccineId) => {
    const v = allVaccinations.find(x => x.id === vaccineId)
    if (!v) return
    const status = new Date(v.scheduled_date) < new Date() ? 'overdue' : 'pending'
    await db.updateVaccination(vaccineId, {
      status, actual_date: null, clinic: null, doctor: null, batch_number: null, side_effects: null
    })
    await reload()
  }

  if (!activeBaby) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <StatPill icon="✅" value={completedCount} label="בוצעו"   color="#22c55e" />
        <StatPill icon="⏳" value={upcomingCount}  label="ממתינים" color="#60a5fa" />
        <StatPill icon="⚠️" value={overdueCount}   label="באיחור"  color="#ef4444" />
      </div>

      {/* View selector */}
      <div style={{ display: 'flex', background: '#161b22', borderRadius: 10, padding: 3, marginBottom: 16, border: '1px solid #30363d', gap: 2 }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: '6px 2px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: view === v.id ? themeColor : 'transparent',
            color: view === v.id ? '#fff' : '#8b949e',
            fontSize: 10, fontWeight: 700, fontFamily: 'Heebo',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
          }}>
            <span style={{ fontSize: 14 }}>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Tipat Chalav */}
      {view === 'tipat' && (
        <div>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10 }}>ביקורים מומלצים בטיפת חלב על פי לוח משרד הבריאות</div>
          {tipatVisits.map((v, i) => {
            const isPast = v.days < 0
            const isNear = v.days >= 0 && v.days <= 14
            const color = isPast ? '#6b7280' : isNear ? '#f59e0b' : '#60a5fa'
            return (
              <div key={i} style={{ background: '#161b22', border: `1px solid ${color}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {isPast ? '✓' : '🏥'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isPast ? '#6b7280' : '#e6edf3' }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>{v.description}</div>
                  <div style={{ fontSize: 11, color, marginTop: 2 }}>
                    {new Date(v.visitDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {!isPast && ` · ${v.days === 0 ? 'היום!' : `בעוד ${v.days} ימים`}`}
                    {isPast && ` · לפני ${Math.abs(v.days)} ימים`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vaccine list */}
      {view !== 'tipat' && (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💉</div>
              <div style={{ fontSize: 14 }}>
                {view === 'completed' ? 'עדיין לא תועד חיסון — הכל לפנינו! 💪' : 'כל החיסונים הממתינים הושלמו 🎉'}
              </div>
            </div>
          )}

          {filtered.map(v => {
            const meta = STATUS_META[v.status] || STATUS_META.pending
            const days = Math.ceil((new Date(v.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24))
            return (
              <div key={v.id} style={{ background: '#161b22', border: `1px solid ${meta.color}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{v.vaccine_group} · {v.age_label}</div>
                    <div style={{ fontSize: 11, color: meta.color, marginTop: 2, fontWeight: 700 }}>
                      {v.status === 'completed'
                        ? `✅ בוצע: ${v.actual_date ? new Date(v.actual_date).toLocaleDateString('he-IL') : ''}${v.clinic ? ' · ' + v.clinic : ''}`
                        : `${v.status === 'overdue' ? '⚠️ ' : ''}${new Date(v.scheduled_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}${days === 0 ? ' – היום!' : days > 0 ? ` – בעוד ${days} ימים` : ` – לפני ${Math.abs(days)} ימים`}`
                      }
                    </div>
                    {v.side_effects && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>תופעות לוואי: {v.side_effects}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {v.status !== 'completed' && (
                      <button onClick={() => {
                        setSelectedVaccine(v)
                        setEditForm({ actual_date: new Date().toISOString().slice(0, 10), clinic: '', doctor: '', batch_number: '', side_effects: '' })
                      }} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo' }}>
                        ✅ בוצע
                      </button>
                    )}
                    {v.status === 'completed' && (
                      <button onClick={() => unmark(v.id)} style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Heebo' }}>
                        בטל
                      </button>
                    )}
                    {v.status !== 'completed' && v.status !== 'skipped' && (
                      <button onClick={() => markSkipped(v.id)} style={{ background: '#21262d', color: '#6b7280', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Heebo' }}>
                        דלג
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Mark done modal */}
      {selectedVaccine && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setSelectedVaccine(null); setEditForm(null) }}>
          <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d', direction: 'rtl', fontFamily: 'Heebo' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>✅ {selectedVaccine.name}</h3>
              <button onClick={() => { setSelectedVaccine(null); setEditForm(null) }} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lbl}>תאריך ביצוע</label>
                <input type="date" value={editForm.actual_date} onChange={e => setEditForm(f => ({ ...f, actual_date: e.target.value }))} style={inp()} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>מרפאה / טיפת חלב</label>
                  <input value={editForm.clinic} onChange={e => setEditForm(f => ({ ...f, clinic: e.target.value }))} placeholder="שם המרפאה..." style={inp()} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>רופא</label>
                  <input value={editForm.doctor} onChange={e => setEditForm(f => ({ ...f, doctor: e.target.value }))} placeholder='ד"ר...' style={inp()} />
                </div>
              </div>
              <div>
                <label style={lbl}>מספר אצווה (אופציונלי)</label>
                <input value={editForm.batch_number} onChange={e => setEditForm(f => ({ ...f, batch_number: e.target.value }))} placeholder="batch number..." style={inp()} />
              </div>
              <div>
                <label style={lbl}>תופעות לוואי / הערות</label>
                <input value={editForm.side_effects} onChange={e => setEditForm(f => ({ ...f, side_effects: e.target.value }))} placeholder="חום, אדמומיות..." style={inp()} />
              </div>
              <button onClick={() => markDone(selectedVaccine.id, editForm)} disabled={saving} style={{ background: saving ? '#14532d' : '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer', marginTop: 4 }}>
                {saving ? '...' : '✅ שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ background: '#161b22', border: `1px solid ${color}33`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6b7280' }}>{label}</div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 5, fontWeight: 600 }
const inp = () => ({
  width: '100%', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 8, padding: '9px 11px', color: '#e6edf3',
  fontFamily: 'Heebo', fontSize: 13, outline: 'none', boxSizing: 'border-box'
})
