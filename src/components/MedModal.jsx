import { useState } from 'react'
import { TIMES, TIME_ICONS, TIME_COLORS, MED_COLORS, INSTRUCTIONS } from '../utils'
import { Input, Select, overlay, sheet, btnPrimary, labelStyle } from './shared'

export default function MedModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', dose: '', times: [], instructions: '', notes: '', expiry: '', color: MED_COLORS[0]
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleTime = t => set('times', form.times.includes(t)
    ? form.times.filter(x => x !== t)
    : [...form.times, t])

  const handleSave = () => {
    if (!form.name.trim()) { alert('נא להזין שם תרופה'); return }
    onSave(form)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{initial ? 'ערוך תרופה' : 'הוסף תרופה'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="שם תרופה *" value={form.name} onChange={v => set('name', v)} placeholder='לדוג׳ אמוקסיצילין' />
          <Input label="מינון" value={form.dose} onChange={v => set('dose', v)} placeholder='לדוג׳ 500מ"ג' />

          <div>
            <label style={labelStyle}>זמני לקיחה</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TIMES.map(t => (
                <button key={t} onClick={() => toggleTime(t)} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'Heebo', fontWeight: 600, transition: 'all 0.2s',
                  background: form.times.includes(t) ? TIME_COLORS[t] : '#21262d',
                  color: form.times.includes(t) ? '#fff' : '#8b949e',
                }}>
                  {TIME_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          <Select label="הנחיות שימוש" value={form.instructions} onChange={v => set('instructions', v)} options={INSTRUCTIONS} />
          <Input label="תאריך תפוגה" value={form.expiry} onChange={v => set('expiry', v)} type="date" />
          <Input label="הערות" value={form.notes} onChange={v => set('notes', v)} placeholder="הערות נוספות..." />

          <div>
            <label style={labelStyle}>צבע</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {MED_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid #fff' : '2px solid transparent', transition: 'all 0.2s'
                }} />
              ))}
            </div>
          </div>

          <button onClick={handleSave} style={{ ...btnPrimary, marginTop: 4 }}>
            {initial ? 'שמור שינויים' : 'הוסף תרופה'}
          </button>
        </div>
      </div>
    </div>
  )
}
