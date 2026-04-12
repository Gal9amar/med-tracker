import { useState } from 'react'
import * as db from '../db'
import { genderColor } from '../utils'

const AVATARS = ['👶', '🧒', '👧', '👦', '🐣', '🌸', '⭐', '🦋', '🌈', '🐥']

export default function BabySwitcher({ babies, activeBabyId, family, user, onSwitch, onBabyAdded, onClose, forceAdd, themeColor = '#a78bfa' }) {
  const [view, setView] = useState(forceAdd ? 'add' : 'list')
  const [editBaby, setEditBaby] = useState(null)
  const [form, setForm] = useState(defaultForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function defaultForm(baby) {
    return {
      name: baby?.name || '',
      avatar: baby?.avatar || '👶',
      birth_date: baby?.birth_date || '',
      gender: baby?.gender || 'unknown',
      weight: baby?.weight || '',
      height: baby?.height || '',
      head_circumference: baby?.head_circumference || '',
      blood_type: baby?.blood_type || '',
      allergies: baby?.allergies || '',
      notes: baby?.notes || '',
      food_type: baby?.food_type || 'formula',
      feeds_per_day: baby?.feeds_per_day || 6,
    }
  }

  const startEdit = (baby) => {
    setEditBaby(baby)
    setForm(defaultForm(baby))
    setView('add')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('שם התינוק חובה'); return }
    if (!form.birth_date) { setError('תאריך לידה חובה'); return }
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      head_circumference: form.head_circumference ? parseFloat(form.head_circumference) : null,
    }

    if (editBaby) {
      const { error: err } = await db.updateBaby(editBaby.id, payload)
      if (err) { setError(err.message); setLoading(false); return }
      await onBabyAdded({ ...editBaby, ...payload })
    } else {
      const { data: baby, error: err } = await db.addBaby(family.id, payload)
      if (err) { setError(err.message); setLoading(false); return }
      await onBabyAdded(baby)
    }
    setLoading(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end',
      fontFamily: 'Heebo', direction: 'rtl'
    }} onClick={onClose}>
      <div style={{
        width: '100%', background: '#161b22', borderRadius: '20px 20px 0 0',
        border: '1px solid #30363d', maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, background: '#30363d', borderRadius: 2 }} />
        </div>

        {view === 'list' && (
          <div style={{ padding: '16px 20px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3' }}>בחר תינוק</div>
              <button onClick={() => { setView('add'); setEditBaby(null); setForm(defaultForm()) }} style={{
                background: themeColor, color: '#fff', border: 'none', borderRadius: 10,
                padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo'
              }}>+ הוסף</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {babies.map(b => {
                const bColor = genderColor(b.gender)
                const isActive = b.id === activeBabyId
                return (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isActive ? bColor + '18' : '#21262d',
                    border: `1px solid ${isActive ? bColor + '60' : '#30363d'}`,
                    borderRadius: 14, padding: '12px 16px', cursor: 'pointer'
                  }} onClick={() => { onSwitch(b.id); onClose() }}>
                    <span style={{ fontSize: 32 }}>{b.avatar || '👶'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? bColor : '#e6edf3' }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: '#8b949e' }}>{b.birth_date}</div>
                    </div>
                    {isActive && <span style={{ color: bColor, fontSize: 18 }}>✓</span>}
                    <button onClick={e => { e.stopPropagation(); startEdit(b) }} style={{
                      background: '#30363d', border: 'none', borderRadius: 8,
                      padding: '6px 10px', color: '#8b949e', cursor: 'pointer', fontSize: 12, fontFamily: 'Heebo'
                    }}>עריכה</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'add' && (
          <div style={{ padding: '16px 20px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3' }}>
                {editBaby ? 'עריכת פרטים' : 'הוסף תינוק'}
              </div>
              {!forceAdd && (
                <button onClick={() => { setView('list'); setError('') }} style={{
                  background: 'none', border: 'none', color: '#8b949e', fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo'
                }}>← חזור</button>
              )}
            </div>

            {/* Avatar picker */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>אווטאר</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))} style={{
                    fontSize: 24, background: form.avatar === a ? genderColor(form.gender) + '22' : '#21262d',
                    border: `2px solid ${form.avatar === a ? genderColor(form.gender) : '#30363d'}`,
                    borderRadius: 10, width: 44, height: 44, cursor: 'pointer'
                  }}>{a}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="שם *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="שם התינוק" />
              <Field label="תאריך לידה *" type="date" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} />

              <div>
                <div style={labelStyle}>מין</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['male','זכר','💙'], ['female','נקבה','💗'], ['unknown','לא ידוע','⬜']].map(([v, l, e]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, gender: v }))} style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${form.gender === v ? genderColor(v) : '#30363d'}`,
                      background: form.gender === v ? genderColor(v) + '18' : '#21262d',
                      color: '#e6edf3', fontFamily: 'Heebo', fontSize: 12, cursor: 'pointer'
                    }}>{e} {l}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label='משקל (ק"ג)' type="number" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="3.5" />
                <Field label='גובה (ס"מ)' type="number" value={form.height} onChange={v => setForm(f => ({ ...f, height: v }))} placeholder="50" />
              </div>
              <Field label='היקף ראש (ס"מ)' type="number" value={form.head_circumference} onChange={v => setForm(f => ({ ...f, head_circumference: v }))} placeholder="34" />
              <Field label="סוג דם" value={form.blood_type} onChange={v => setForm(f => ({ ...f, blood_type: v }))} placeholder="A+" />
              <Field label="אלרגיות" value={form.allergies} onChange={v => setForm(f => ({ ...f, allergies: v }))} placeholder="ללא" />
              <Field label="הערות" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="..." />

              {/* Feeding info */}
              <div style={{ borderTop: '1px solid #30363d', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: genderColor(form.gender), marginBottom: 12 }}>🍼 מידע האכלה</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>סוג אוכל עיקרי</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      ['breast',  'חלב אם',    '🤱'],
                      ['formula', 'פורמולה',   '🍼'],
                      ['mixed',   'משולב',     '🤱🍼'],
                      ['solid',   'מוצקים',    '🥣'],
                    ].map(([v, l, e]) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, food_type: v }))} style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${form.food_type === v ? genderColor(form.gender) : '#30363d'}`,
                        background: form.food_type === v ? genderColor(form.gender) + '18' : '#21262d',
                        color: form.food_type === v ? genderColor(form.gender) : '#8b949e',
                        fontFamily: 'Heebo', fontSize: 12, cursor: 'pointer'
                      }}>{e} {l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>מספר האכלות ביום (לחישוב מ"ל/האכלה)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[4, 5, 6, 7, 8].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, feeds_per_day: n }))} style={{
                        padding: '8px 14px', borderRadius: 10,
                        border: `1px solid ${form.feeds_per_day === n ? genderColor(form.gender) : '#30363d'}`,
                        background: form.feeds_per_day === n ? genderColor(form.gender) + '18' : '#21262d',
                        color: form.feeds_per_day === n ? genderColor(form.gender) : '#8b949e',
                        fontFamily: 'Heebo', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                      }}>{n}</button>
                    ))}
                  </div>
                  {form.weight && form.feeds_per_day && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#60a5fa', background: '#60a5fa11', borderRadius: 8, padding: '6px 10px' }}>
                      💡 לפי המשקל: {Math.round(parseFloat(form.weight) * 150 / form.feeds_per_day)} מ"ל להאכלה
                      ({Math.round(parseFloat(form.weight) * 150)} מ"ל/יום ÷ {form.feeds_per_day} האכלות)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <div style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#ef4444', marginTop: 12 }}>{error}</div>}

            <button onClick={handleSave} disabled={loading} style={{
              width: '100%', marginTop: 20, padding: '14px 0', background: loading ? '#374151' : genderColor(form.gender),
              color: '#fff', border: 'none', borderRadius: 12,
              fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
            }}>
              {loading ? '...' : editBaby ? 'שמור שינויים' : '+ הוסף תינוק'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#0d1117', border: '1px solid #30363d',
          borderRadius: 10, padding: '10px 12px', color: '#e6edf3',
          fontFamily: 'Heebo', fontSize: 14, outline: 'none', boxSizing: 'border-box'
        }}
      />
    </div>
  )
}

const labelStyle = { fontSize: 12, color: '#8b949e', marginBottom: 6, fontWeight: 600, display: 'block' }
