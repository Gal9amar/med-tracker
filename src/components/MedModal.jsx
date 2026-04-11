import { useState, useRef } from 'react'
import { TIMES, TIME_ICONS, TIME_COLORS, MED_COLORS, INSTRUCTIONS } from '../utils'
import { Input, Select, overlay, sheet, btnPrimary, labelStyle, inputStyle } from './shared'

export default function MedModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', dose: '', times: [], instructions: '', notes: '',
    expiry: '', color: MED_COLORS[0], photo: null,
    stockCount: '', stockAlert: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleTime = t => set('times', form.times.includes(t)
    ? form.times.filter(x => x !== t)
    : [...form.times, t])
  const fileRef = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set('photo', ev.target.result)
    reader.readAsDataURL(file)
  }

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

          {/* Photo */}
          <div>
            <label style={labelStyle}>תמונת תרופה</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {form.photo
                ? <img src={form.photo} alt="med" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #30363d' }} />
                : <div style={{ width: 64, height: 64, borderRadius: 8, background: '#21262d', border: '1px dashed #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📷</div>
              }
              <button onClick={() => fileRef.current?.click()} style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', fontSize: 13, fontFamily: 'Heebo', cursor: 'pointer' }}>
                {form.photo ? 'החלף תמונה' : 'צלם / העלה'}
              </button>
              {form.photo && <button onClick={() => set('photo', null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 18, cursor: 'pointer' }}>🗑️</button>}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>
          </div>

          <Input label="שם תרופה *" value={form.name} onChange={v => set('name', v)} placeholder="לדוג׳ אמוקסיצילין" />
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

          <div style={{ background: '#21262d', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700, color: '#e6edf3' }}>📦 מעקב מלאי</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>כמות נוכחית (טבליות)</label>
                <input type="number" value={form.stockCount} onChange={e => set('stockCount', e.target.value)}
                  placeholder="30" style={inputStyle} min="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>התראה כשנשארו</label>
                <input type="number" value={form.stockAlert} onChange={e => set('stockAlert', e.target.value)}
                  placeholder="7" style={inputStyle} min="0" />
              </div>
            </div>
          </div>

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
