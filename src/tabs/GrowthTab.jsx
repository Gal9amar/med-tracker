import { useState } from 'react'
import { ageInMonths } from '../utils'
import { MILESTONES, CATEGORY_META } from '../data/milestones'
import * as db from '../db'

const GROWTH_VIEWS = [
  { id: 'measurements', label: 'מדידות',  icon: '📏' },
  { id: 'milestones',   label: 'אבני דרך', icon: '🌟' },
]

export default function GrowthTab({ data, reload, family, activeBaby, babyName, themeColor = '#a78bfa' }) {
  const [view, setView] = useState('measurements')
  const [showForm, setShowForm] = useState(false)
  const [milestoneFilter, setMilestoneFilter] = useState('all')

  const babyId = activeBaby?.id
  const growthLog = (data.growthLog || []).filter(g => g.baby_id === babyId).sort((a, b) => b.date > a.date ? 1 : -1)
  const babyMilestones = (data.milestones || []).filter(m => m.baby_id === babyId)
  const months = ageInMonths(activeBaby?.birth_date) || 0

  if (!activeBaby) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      {/* Baby summary */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 40 }}>{activeBaby.avatar || '👶'}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#f9a8d4' }}>{babyName}</div>
          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
            {months < 12 ? `${months} חודשים` : `${Math.floor(months/12)} שנים ו-${months%12} חודשים`}
          </div>
          {activeBaby.weight && <div style={{ fontSize: 13, color: '#e6edf3', marginTop: 4 }}>
            ⚖️ {activeBaby.weight} ק"ג
            {activeBaby.height ? ` · 📏 ${activeBaby.height} ס"מ` : ''}
            {activeBaby.head_circumference ? ` · 🔵 ${activeBaby.head_circumference} ס"מ` : ''}
          </div>}
        </div>
      </div>

      {/* View selector */}
      <div style={{ display: 'flex', background: '#161b22', borderRadius: 10, padding: 3, marginBottom: 16, border: '1px solid #30363d', gap: 2 }}>
        {GROWTH_VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: view === v.id ? themeColor : 'transparent',
            color: view === v.id ? '#fff' : '#8b949e',
            fontSize: 12, fontWeight: 700, fontFamily: 'Heebo',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <span>{v.icon}</span><span>{v.label}</span>
          </button>
        ))}
      </div>

      {view === 'measurements' && (
        <MeasurementsView
          growthLog={growthLog} activeBaby={activeBaby}
          babyId={babyId} family={family}
          showForm={showForm} setShowForm={setShowForm}
          reload={reload} themeColor={themeColor}
        />
      )}

      {view === 'milestones' && (
        <MilestonesView
          babyMilestones={babyMilestones} babyId={babyId}
          family={family} months={months}
          filter={milestoneFilter} setFilter={setMilestoneFilter}
          reload={reload} themeColor={themeColor}
        />
      )}
    </div>
  )
}

function MeasurementsView({ growthLog, activeBaby, babyId, family, showForm, setShowForm, reload, themeColor = '#a78bfa' }) {
  const emptyForm = { date: new Date().toISOString().slice(0, 10), weight: '', height: '', head_circumference: '', notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleSave = async () => {
    if (!form.date || (!form.weight && !form.height && !form.head_circumference)) return
    setSaving(true)
    await db.addGrowthEntry(family.id, babyId, {
      date: form.date,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      head_circumference: form.head_circumference ? parseFloat(form.head_circumference) : null,
      notes: form.notes || null,
    })
    // Update baby's current measurements if this is the latest
    if (!growthLog.length || form.date >= growthLog[0]?.date) {
      await db.updateBaby(babyId, {
        weight: form.weight ? parseFloat(form.weight) : activeBaby.weight,
        height: form.height ? parseFloat(form.height) : activeBaby.height,
        head_circumference: form.head_circumference ? parseFloat(form.head_circumference) : activeBaby.head_circumference,
      })
    }
    await reload()
    setShowForm(false)
    setForm(emptyForm)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await db.deleteGrowthEntry(id)
    await reload()
    setDeleting(null)
  }

  const weightPoints = growthLog.filter(g => g.weight).slice().reverse()

  return (
    <div>
      <button onClick={() => setShowForm(true)} style={{
        width: '100%', padding: '12px 0', marginBottom: 14,
        background: themeColor, color: '#fff', border: 'none', borderRadius: 12,
        fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: 'pointer'
      }}>+ הוסף מדידה</button>

      {weightPoints.length >= 2 && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', marginBottom: 10 }}>📈 גרף משקל</div>
          <WeightChart points={weightPoints} themeColor={themeColor} />
        </div>
      )}

      {growthLog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📏</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8b949e' }}>אין מדידות עדיין</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>הוסף מדידות לעקוב אחרי הגדילה</div>
        </div>
      ) : growthLog.map(g => (
        <div key={g.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8b949e', marginBottom: 6 }}>
                {new Date(g.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {g.weight && <Metric icon="⚖️" value={`${g.weight} ק"ג`} color={themeColor} />}
                {g.height && <Metric icon="📏" value={`${g.height} ס"מ`} color="#60a5fa" />}
                {g.head_circumference && <Metric icon="🔵" value={`${g.head_circumference} ס"מ`} color="#a78bfa" />}
              </div>
              {g.notes && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5 }}>{g.notes}</div>}
            </div>
            <button onClick={() => handleDelete(g.id)} disabled={deleting === g.id} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
          </div>
        </div>
      ))}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', border: '1px solid #30363d', direction: 'rtl', fontFamily: 'Heebo' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📏 הוסף מדידה</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp()} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>משקל (ק"ג)</label>
                  <input type="number" step="0.01" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="5.2" style={inp()} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>גובה (ס"מ)</label>
                  <input type="number" step="0.1" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="58" style={inp()} />
                </div>
              </div>
              <div>
                <label style={lbl}>היקף ראש (ס"מ)</label>
                <input type="number" step="0.1" value={form.head_circumference} onChange={e => setForm(f => ({ ...f, head_circumference: e.target.value }))} placeholder="38" style={inp()} />
              </div>
              <div>
                <label style={lbl}>הערות</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="בדיקת טיפת חלב..." style={inp()} />
              </div>
              <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#2d2640' : themeColor, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer', marginTop: 4 }}>
                {saving ? '...' : '💾 שמור מדידה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WeightChart({ points, themeColor = '#a78bfa' }) {
  const W = 300, H = 80, pad = 10
  const weights = points.map(p => p.weight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const coords = points.map((p, i) => ({
    x: pad + (i / Math.max(points.length - 1, 1)) * (W - pad * 2),
    y: H - pad - ((p.weight - minW) / range) * (H - pad * 2)
  }))
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
        <polyline points={coords.map(c => `${c.x},${c.y}`).join(' ')} fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="4" fill={themeColor} />
            <text x={c.x} y={c.y - 7} textAnchor="middle" fontSize="8" fill="#f9a8d4">{points[i].weight}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginTop: 2 }}>
        <span>{new Date(points[0].date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

function MilestonesView({ babyMilestones, babyId, family, months, filter, setFilter, reload, themeColor = '#a78bfa' }) {
  const [saving, setSaving] = useState(null)
  const categories = ['all', 'motor', 'language', 'social', 'cognitive']
  const catLabels = { all: 'הכל', motor: 'מוטורי', language: 'שפה', social: 'חברתי', cognitive: 'קוגניטיבי' }

  const isAchieved = (milestoneId) => babyMilestones.some(m => m.milestone_id === milestoneId)

  const handleToggle = async (milestone) => {
    setSaving(milestone.id)
    const achieved = isAchieved(milestone.id)
    await db.toggleMilestone(family.id, babyId, milestone.id, !achieved)
    await reload()
    setSaving(null)
  }

  const filtered = MILESTONES.filter(m => filter === 'all' || m.category === filter)
  const achievedCount = filtered.filter(m => isAchieved(m.id)).length

  return (
    <div>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => {
          const meta = CATEGORY_META[cat]
          return (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === cat ? (meta?.color || themeColor) : '#21262d',
              color: filter === cat ? '#fff' : '#8b949e',
              fontFamily: 'Heebo', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
            }}>{meta?.icon || ''} {catLabels[cat]}</button>
          )
        })}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 14, background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
          <span>התקדמות</span>
          <span>{achievedCount}/{filtered.length}</span>
        </div>
        <div style={{ background: '#30363d', borderRadius: 4, height: 8 }}>
          <div style={{ background: themeColor, height: 8, borderRadius: 4, width: `${Math.round(achievedCount / filtered.length * 100)}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {filtered.map(m => {
        const achieved = isAchieved(m.id)
        const isLate = !achieved && months > m.expectedMonth + 2
        const isSoon = !achieved && months >= m.expectedMonth - 1 && months <= m.expectedMonth + 1
        const catMeta = CATEGORY_META[m.category]
        return (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: achieved ? '#22c55e10' : '#161b22',
            border: `1px solid ${achieved ? '#22c55e40' : isLate ? '#ef444430' : '#30363d'}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 8
          }}>
            <button onClick={() => handleToggle(m)} disabled={saving === m.id} style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: achieved ? '#22c55e' : '#21262d',
              border: `2px solid ${achieved ? '#22c55e' : '#30363d'}`,
              cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {saving === m.id ? '⟳' : achieved ? '✓' : ''}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: achieved ? '#86efac' : '#e6edf3' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                <span style={{ color: catMeta?.color || '#8b949e', marginLeft: 6 }}>{catMeta?.icon} {catMeta?.label}</span>
                · גיל מצופה: {m.expectedMonth} חודשים
                {isLate && <span style={{ color: '#ef4444', marginRight: 6 }}> · מאוחר</span>}
                {isSoon && !achieved && <span style={{ color: '#f59e0b', marginRight: 6 }}> · עכשיו</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Metric({ icon, value, color }) {
  return (
    <div style={{ background: color + '18', border: `1px solid ${color}33`, borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 5, fontWeight: 600 }
const inp = () => ({
  width: '100%', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 8, padding: '9px 11px', color: '#e6edf3',
  fontFamily: 'Heebo', fontSize: 13, outline: 'none', boxSizing: 'border-box'
})
