import { useState } from 'react'
import { uid } from '../utils'
import { overlay, sheet, inputStyle, labelStyle, btnPrimary } from '../components/shared'

const HMO_OPTIONS = ['מכבי', 'כללית', 'מאוחדת', 'לאומית', 'פרטי', 'אחר']
const MONTHS_OPTIONS = ['1', '2', '3', '6', '12']

function daysUntilRenewal(dateStr, months) {
  if (!dateStr || !months) return null
  const start = new Date(dateStr)
  const renewal = new Date(start)
  renewal.setMonth(renewal.getMonth() + Number(months))
  const diff = renewal - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function renewalColor(days) {
  if (days === null) return '#6b7280'
  if (days < 0) return '#ef4444'
  if (days <= 14) return '#ef4444'
  if (days <= 30) return '#f59e0b'
  return '#22c55e'
}

function renewalLabel(days) {
  if (days === null) return '—'
  if (days < 0) return `פג לפני ${Math.abs(days)} ימים!`
  if (days === 0) return 'פג היום!'
  if (days === 1) return 'מחר!'
  if (days <= 30) return `בעוד ${days} ימים`
  return `בעוד ${days} ימים`
}

function getRenewalDate(dateStr, months) {
  if (!dateStr || !months) return null
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + Number(months))
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PrescriptionModal({ onClose, onSave, initial, profileMeds }) {
  const [form, setForm] = useState(initial || {
    medName: '', doctorName: '', hmo: '', date: '',
    months: '3', quantity: '', notes: '', linkedMedId: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{initial ? 'ערוך מרשם' : 'הוסף מרשם'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

          {/* Link to existing med */}
          {profileMeds?.length > 0 && (
            <div>
              <label style={labelStyle}>קשר לתרופה קיימת (אופציונלי)</label>
              <select value={form.linkedMedId} onChange={e => {
                const med = profileMeds.find(m => m.id === e.target.value)
                set('linkedMedId', e.target.value)
                if (med) set('medName', med.name)
              }} style={inputStyle}>
                <option value="">בחר תרופה...</option>
                {profileMeds.map(m => <option key={m.id} value={m.id}>{m.name} {m.dose || ''}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>שם התרופה *</label>
            <input value={form.medName} onChange={e => set('medName', e.target.value)}
              placeholder="לדוג׳ אמוקסיצילין" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>שם הרופא</label>
              <input value={form.doctorName} onChange={e => set('doctorName', e.target.value)}
                placeholder="ד״ר כהן" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>קופת חולים</label>
              <select value={form.hmo} onChange={e => set('hmo', e.target.value)} style={inputStyle}>
                <option value="">בחר...</option>
                {HMO_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>תאריך קבלת המרשם</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>תוקף (חודשים)</label>
              <select value={form.months} onChange={e => set('months', e.target.value)} style={inputStyle}>
                {MONTHS_OPTIONS.map(m => <option key={m} value={m}>{m} חודשים</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>כמות במרשם</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                placeholder="90 טבליות" style={inputStyle} min="0" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>הערות</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="הערות נוספות..." style={inputStyle} />
          </div>

          {/* Preview renewal date */}
          {form.date && form.months && (
            <div style={{ background: '#21262d', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#8b949e' }}>📅 תאריך חידוש מחושב:</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#58a6ff', marginTop: 4 }}>
                {getRenewalDate(form.date, form.months)}
              </p>
              {(() => {
                const d = daysUntilRenewal(form.date, form.months)
                return d !== null && (
                  <p style={{ fontSize: 12, color: renewalColor(d), marginTop: 3 }}>
                    {d < 0 ? '⚠️' : d <= 30 ? '🔔' : '✅'} {renewalLabel(d)}
                  </p>
                )
              })()}
            </div>
          )}

          <button onClick={() => { if (!form.medName.trim()) { alert('נא להזין שם תרופה'); return } onSave(form) }}
            style={{ ...btnPrimary, marginTop: 4 }}>
            {initial ? '💾 שמור שינויים' : '✅ הוסף מרשם'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PrescriptionsTab({ data, update, profileName }) {
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const prescriptions = (data.prescriptions || []).filter(p => p.profileId === data.activeProfile)
  const profileMeds = data.meds.filter(m => m.profileId === data.activeProfile)

  const sorted = [...prescriptions].sort((a, b) => {
    const da = daysUntilRenewal(a.date, a.months) ?? 9999
    const db = daysUntilRenewal(b.date, b.months) ?? 9999
    return da - db
  })

  const urgent = sorted.filter(p => {
    const d = daysUntilRenewal(p.date, p.months)
    return d !== null && d <= 30
  })

  const handleSave = (form) => {
    if (editTarget) {
      update(d => ({ ...d, prescriptions: (d.prescriptions || []).map(p => p.id === editTarget.id ? { ...form, id: editTarget.id, profileId: editTarget.profileId } : p) }))
    } else {
      update(d => ({ ...d, prescriptions: [...(d.prescriptions || []), { ...form, id: uid(), profileId: d.activeProfile }] }))
    }
    setShowModal(false)
    setEditTarget(null)
  }

  const handleDelete = (id) => {
    if (!confirm('למחוק מרשם זה?')) return
    update(d => ({ ...d, prescriptions: (d.prescriptions || []).filter(p => p.id !== id) }))
  }

  return (
    <div>
      {/* Header */}
      <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 14, lineHeight: 1.5 }}>
        המרשמים של <span style={{ color: '#58a6ff', fontWeight: 700 }}>{profileName}</span> – כדי שלא תפספס חידוש 📋
      </p>

      {/* Urgent alerts */}
      {urgent.length > 0 && (
        <div style={{ background: '#ef444412', border: '1px solid #ef444440', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>🔔 מרשמים לחידוש בקרוב</p>
          {urgent.map(p => {
            const days = daysUntilRenewal(p.date, p.months)
            return (
              <p key={p.id} style={{ fontSize: 12, color: '#fca5a5', marginTop: 3 }}>
                {p.medName} – {renewalLabel(days)}
              </p>
            )
          })}
        </div>
      )}

      <button onClick={() => { setEditTarget(null); setShowModal(true) }} style={{
        ...btnPrimary, marginBottom: 16
      }}>+ הוסף מרשם</button>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>אין מרשמים עדיין</p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#6b7280' }}>הוסף מרשם כדי לעקוב אחרי חידושים</p>
        </div>
      )}

      {sorted.map(p => {
        const days = daysUntilRenewal(p.date, p.months)
        const rc = renewalColor(days)
        const isUrgent = days !== null && days <= 30
        return (
          <div key={p.id} style={{
            background: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10,
            border: `1px solid ${isUrgent ? rc + '44' : '#30363d'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>💊 {p.medName}</span>
                  {isUrgent && (
                    <span style={{ fontSize: 11, background: rc + '22', color: rc, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                      {renewalLabel(days)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                  {p.doctorName && (
                    <div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>רופא</div>
                      <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{p.doctorName}</div>
                    </div>
                  )}
                  {p.hmo && (
                    <div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>קופ״ח</div>
                      <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{p.hmo}</div>
                    </div>
                  )}
                  {p.quantity && (
                    <div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>כמות</div>
                      <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{p.quantity} טבליות</div>
                    </div>
                  )}
                  {p.months && (
                    <div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>תוקף</div>
                      <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{p.months} חודשים</div>
                    </div>
                  )}
                </div>

                {/* Renewal date */}
                {p.date && p.months && (
                  <div style={{ marginTop: 10, background: '#21262d', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>תאריך חידוש</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rc, marginTop: 2 }}>
                          📅 {getRenewalDate(p.date, p.months)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: rc }}>
                          {days !== null && days >= 0 ? days : '!'}
                        </div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>ימים</div>
                      </div>
                    </div>
                  </div>
                )}

                {p.notes && <p style={{ fontSize: 12, color: '#8b949e', marginTop: 8 }}>📝 {p.notes}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setEditTarget(p); setShowModal(true) }} style={iconBtn()}>✏️</button>
                <button onClick={() => handleDelete(p.id)} style={iconBtn()}>🗑️</button>
              </div>
            </div>
          </div>
        )
      })}

      {showModal && (
        <PrescriptionModal
          initial={editTarget}
          profileMeds={profileMeds}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

const iconBtn = () => ({
  background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
  width: 34, height: 34, cursor: 'pointer', fontSize: 15,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
})
