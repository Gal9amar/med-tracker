import { useState } from 'react'
import * as db from '../db'

const SUB_TABS = [
  { id: 'meds',          label: 'תרופות',      icon: '💊' },
  { id: 'prescriptions', label: 'מרשמים',      icon: '📋' },
  { id: 'inventory',     label: 'ארון תרופות', icon: '🏠' },
]

const MED_COLORS = ['#f472b6','#60a5fa','#34d399','#a78bfa','#fb923c','#f87171']
const HMO_OPTIONS = ['מכבי', 'כללית', 'מאוחדת', 'לאומית', 'פרטי', 'אחר']

export default function HealthTab({ data, reload, family, activeBaby, babyName, themeColor = '#a78bfa' }) {
  const [sub, setSub] = useState('meds')

  const babyId = activeBaby?.id
  const babyMeds = (data.meds || []).filter(m => m.baby_id === babyId)
  const babyPrescriptions = (data.prescriptions || []).filter(p => p.baby_id === babyId)
  const inventory = data.inventory || []

  if (!activeBaby) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Heebo' }}>
      <div style={{ display: 'flex', background: '#161b22', borderRadius: 12, padding: 4, marginBottom: 18, border: '1px solid #30363d' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: sub === t.id ? themeColor : 'transparent',
            color: sub === t.id ? '#fff' : '#8b949e',
            fontSize: 12, fontWeight: 700, fontFamily: 'Heebo',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {sub === 'meds'          && <MedsSection meds={babyMeds} data={data} family={family} babyId={babyId} babyName={babyName} reload={reload} themeColor={themeColor} />}
      {sub === 'prescriptions' && <PrescriptionsSection prescriptions={babyPrescriptions} family={family} babyId={babyId} reload={reload} />}
      {sub === 'inventory'     && <InventorySection inventory={inventory} family={family} reload={reload} />}
    </div>
  )
}

// ── MEDS ────────────────────────────────────────────────────────────────────

function MedsSection({ meds, data, family, babyId, babyName, reload, themeColor = '#a78bfa' }) {
  const [showForm, setShowForm] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const [form, setForm] = useState(emptyMedForm())
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const medsTaken = (data.medLog || []).filter(l => l.baby_id === babyId && l.date === today)

  function emptyMedForm(med) {
    return {
      name: med?.name || '',
      dose: med?.dose || '',
      times: med?.times || ['08:00'],
      instructions: med?.instructions || '',
      expiry: med?.expiry || '',
      color: med?.color || '#a78bfa',
      stock_count: med?.stock_count ?? 0,
      stock_alert: med?.stock_alert ?? 5,
    }
  }

  const openEdit = (med) => { setEditMed(med); setForm(emptyMedForm(med)); setShowForm(true) }
  const openAdd  = ()    => { setEditMed(null); setForm(emptyMedForm()); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editMed) {
      await db.updateMed(editMed.id, form)
    } else {
      await db.addMed(family.id, babyId, form)
    }
    await reload()
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק תרופה זו?')) return
    await db.deleteMed(id)
    await reload()
  }

  const handleTakeDose = async (med, time) => {
    const alreadyTaken = medsTaken.find(l => l.med_id === med.id && l.time === time)
    if (alreadyTaken) {
      await db.deleteMedLog(alreadyTaken.id)
    } else {
      await db.addMedLog(family.id, babyId, { med_id: med.id, date: today, time })
    }
    await reload()
  }

  const addTime = () => setForm(f => ({ ...f, times: [...f.times, '12:00'] }))
  const removeTime = (i) => setForm(f => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }))
  const setTime = (i, v) => setForm(f => ({ ...f, times: f.times.map((t, idx) => idx === i ? v : t) }))

  return (
    <div>
      <button onClick={openAdd} style={addBtn('#388bfd')}>+ הוסף תרופה</button>

      {meds.length === 0 ? (
        <Empty icon="💊" text="אין תרופות רשומות" sub={`הוסף תרופות של ${babyName}`} />
      ) : meds.map(med => {
        const taken = medsTaken.filter(l => l.med_id === med.id)
        const totalDoses = med.times?.length || 0
        return (
          <div key={med.id} style={{ background: '#161b22', border: `1px solid ${med.color || '#a78bfa'}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: med.color || '#a78bfa' }}>{med.name}</div>
                {med.dose && <div style={{ fontSize: 12, color: '#8b949e' }}>{med.dose}</div>}
                {med.instructions && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{med.instructions}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(med)} style={iconBtn}>✏️</button>
                <button onClick={() => handleDelete(med.id)} style={iconBtn}>🗑️</button>
              </div>
            </div>

            {/* Dose buttons */}
            {med.times && med.times.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {med.times.map((time, i) => {
                  const isTaken = medsTaken.some(l => l.med_id === med.id && l.time === time)
                  return (
                    <button key={i} onClick={() => handleTakeDose(med, time)} style={{
                      padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: isTaken ? '#22c55e22' : (med.color || '#388bfd') + '22',
                      color: isTaken ? '#22c55e' : (med.color || '#388bfd'),
                      fontFamily: 'Heebo', fontSize: 13, fontWeight: 700
                    }}>
                      {isTaken ? '✅' : '💊'} {time}
                    </button>
                  )
                })}
              </div>
            )}

            {totalDoses > 0 && (
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
                {taken.length}/{totalDoses} מנות היום
              </div>
            )}

            {med.stock_count !== null && med.stock_alert && med.stock_count <= med.stock_alert && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>⚠️ מלאי נמוך: {med.stock_count} יחידות</div>
            )}
          </div>
        )
      })}

      {/* Form modal */}
      {showForm && (
        <div style={modalOverlay} onClick={() => setShowForm(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <ModalHeader title={editMed ? 'עריכת תרופה' : 'הוסף תרופה'} onClose={() => setShowForm(false)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="שם תרופה *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="מינון" value={form.dose} onChange={v => setForm(f => ({ ...f, dose: v }))} placeholder='5 מ"ל' />
              <Field label="הוראות" value={form.instructions} onChange={v => setForm(f => ({ ...f, instructions: v }))} />
              <Field label="תפוגה" type="date" value={form.expiry} onChange={v => setForm(f => ({ ...f, expiry: v }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="מלאי" type="number" value={form.stock_count} onChange={v => setForm(f => ({ ...f, stock_count: parseInt(v) || 0 }))} />
                <Field label="התראה בכמה" type="number" value={form.stock_alert} onChange={v => setForm(f => ({ ...f, stock_alert: parseInt(v) || 5 }))} />
              </div>
              <div>
                <div style={lbl}>צבע</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {MED_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : 'none', cursor: 'pointer'
                    }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={lbl}>שעות נטילה</div>
                {form.times.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input type="time" value={t} onChange={e => setTime(i, e.target.value)} style={{ ...inp(), flex: 1 }} />
                    {form.times.length > 1 && <button onClick={() => removeTime(i)} style={iconBtn}>✕</button>}
                  </div>
                ))}
                <button onClick={addTime} style={{ background: 'none', border: '1px dashed #30363d', borderRadius: 8, padding: '6px 12px', color: '#6b7280', cursor: 'pointer', fontFamily: 'Heebo', fontSize: 12 }}>+ הוסף שעה</button>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} style={saveBtn(themeColor)}>{saving ? '...' : editMed ? 'שמור' : 'הוסף'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PRESCRIPTIONS ────────────────────────────────────────────────────────────

function PrescriptionsSection({ prescriptions, family, babyId, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyRxForm())
  const [saving, setSaving] = useState(false)

  function emptyRxForm() {
    return { med_name: '', doctor_name: '', hmo: 'מכבי', date: new Date().toISOString().slice(0, 10), months: 3, quantity: '', notes: '' }
  }

  const handleSave = async () => {
    if (!form.med_name.trim()) return
    setSaving(true)
    await db.addPrescription(family.id, babyId, form)
    await reload()
    setShowForm(false)
    setForm(emptyRxForm())
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await db.deletePrescription(id)
    await reload()
  }

  return (
    <div>
      <button onClick={() => setShowForm(v => !v)} style={addBtn('#a78bfa')}>
        {showForm ? '✕ ביטול' : '+ הוסף מרשם'}
      </button>

      {showForm && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="שם תרופה *" value={form.med_name} onChange={v => setForm(f => ({ ...f, med_name: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label='ד"ר' value={form.doctor_name} onChange={v => setForm(f => ({ ...f, doctor_name: v }))} />
              <div>
                <div style={lbl}>קופת חולים</div>
                <select value={form.hmo} onChange={e => setForm(f => ({ ...f, hmo: e.target.value }))} style={{ ...inp(), appearance: 'none' }}>
                  {HMO_OPTIONS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="תאריך" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
              <Field label="חודשים" type="number" value={form.months} onChange={v => setForm(f => ({ ...f, months: v }))} />
            </div>
            <Field label="כמות" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} placeholder='2 אריזות' />
            <Field label="הערות" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
          </div>
          <button onClick={handleSave} disabled={saving} style={saveBtn()}>{saving ? '...' : '+ הוסף מרשם'}</button>
        </div>
      )}

      {prescriptions.length === 0 ? (
        <Empty icon="📋" text="אין מרשמים" sub="הוסף מרשמים לעקוב אחרי חידושים" />
      ) : prescriptions.map(rx => {
        const renewDate = rx.date ? new Date(rx.date) : null
        if (renewDate && rx.months) renewDate.setMonth(renewDate.getMonth() + parseInt(rx.months))
        const daysLeft = renewDate ? Math.ceil((renewDate - new Date()) / (1000 * 60 * 60 * 24)) : null
        const color = daysLeft === null ? '#8b949e' : daysLeft < 0 ? '#ef4444' : daysLeft <= 14 ? '#f59e0b' : '#22c55e'
        return (
          <div key={rx.id} style={{ background: '#161b22', border: `1px solid #a78bfa33`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>{rx.med_name}</div>
                {rx.doctor_name && <div style={{ fontSize: 12, color: '#8b949e' }}>ד"ר {rx.doctor_name} · {rx.hmo}</div>}
                {daysLeft !== null && (
                  <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 700 }}>
                    {daysLeft < 0 ? `פג תוקף לפני ${Math.abs(daysLeft)} ימים` : daysLeft === 0 ? 'פג תוקף היום!' : `חידוש בעוד ${daysLeft} ימים`}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(rx.id)} style={iconBtn}>🗑️</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── INVENTORY ────────────────────────────────────────────────────────────────

function InventorySection({ inventory, family, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyInvForm())
  const [saving, setSaving] = useState(false)

  function emptyInvForm() {
    return { name: '', quantity: '', location: 'ארון תרופות', instructions: '', expiry: '', notes: '' }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await db.addInventoryItem(family.id, form)
    await reload()
    setShowForm(false)
    setForm(emptyInvForm())
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await db.deleteInventoryItem(id)
    await reload()
  }

  return (
    <div>
      <button onClick={() => setShowForm(v => !v)} style={addBtn('#fb923c')}>
        {showForm ? '✕ ביטול' : '+ הוסף פריט'}
      </button>

      {showForm && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="שם *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="כמות" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} placeholder='2 אריזות' />
              <Field label="מיקום" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
            </div>
            <Field label="הוראות" value={form.instructions} onChange={v => setForm(f => ({ ...f, instructions: v }))} />
            <Field label="תאריך תפוגה" type="date" value={form.expiry} onChange={v => setForm(f => ({ ...f, expiry: v }))} />
          </div>
          <button onClick={handleSave} disabled={saving} style={saveBtn()}>{saving ? '...' : '+ הוסף פריט'}</button>
        </div>
      )}

      {inventory.length === 0 ? (
        <Empty icon="🏠" text="ארון התרופות ריק" sub="הוסף תרופות שיש בבית" />
      ) : inventory.map(item => {
        const daysLeft = item.expiry ? Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24)) : null
        const color = daysLeft === null ? '#8b949e' : daysLeft < 0 ? '#ef4444' : daysLeft <= 30 ? '#f59e0b' : '#22c55e'
        return (
          <div key={item.id} style={{ background: '#161b22', border: '1px solid #fb923c33', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fb923c' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>
                  {item.quantity && `${item.quantity} · `}{item.location}
                </div>
                {daysLeft !== null && (
                  <div style={{ fontSize: 11, color, marginTop: 3, fontWeight: 700 }}>
                    {daysLeft < 0 ? `פג תוקף` : daysLeft === 0 ? 'פג תוקף היום!' : daysLeft <= 30 ? `פג תוקף בעוד ${daysLeft} ימים` : `תפוגה: ${item.expiry}`}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(item.id)} style={iconBtn}>🗑️</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <div style={lbl}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inp()} />
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>{title}</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
    </div>
  )
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#8b949e' }}>{text}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 5, fontWeight: 600 }
const inp = () => ({
  width: '100%', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 10, padding: '10px 12px', color: '#e6edf3',
  fontFamily: 'Heebo', fontSize: 14, outline: 'none', boxSizing: 'border-box'
})
const addBtn = (color) => ({
  width: '100%', padding: '12px 0', marginBottom: 14,
  background: color + '22', color, border: `1px solid ${color}44`,
  borderRadius: 12, fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: 'pointer'
})
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4
}
const modalOverlay = {
  position: 'fixed', inset: 0, background: '#000000aa', zIndex: 200,
  display: 'flex', alignItems: 'flex-end', fontFamily: 'Heebo', direction: 'rtl'
}
const modalBox = {
  background: '#161b22', borderRadius: '16px 16px 0 0',
  padding: 20, width: '100%', border: '1px solid #30363d',
  maxHeight: '90vh', overflowY: 'auto'
}
const saveBtn = (color = '#a78bfa') => ({
  width: '100%', marginTop: 16, padding: '13px 0', background: color,
  color: '#fff', border: 'none', borderRadius: 12,
  fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: 'pointer'
})
