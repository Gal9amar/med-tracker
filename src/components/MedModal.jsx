import { useState, useRef } from 'react'
import { TIMES, TIME_ICONS, TIME_COLORS, MED_COLORS, INSTRUCTIONS } from '../utils'
import { Input, Select, overlay, sheet, btnPrimary, labelStyle, inputStyle } from './shared'

// Default times per slot
const DEFAULT_HOURS = { 'בוקר': '08:00', 'צהריים': '13:00', 'ערב': '19:00', 'לילה': '22:00' }

export default function MedModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', dose: '', times: [], timeHours: {}, instructions: '', notes: '',
    expiry: '', color: MED_COLORS[0], photo: null, stockCount: '', stockAlert: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const fileRef = useRef()

  const toggleTime = t => {
    const selected = form.times.includes(t)
    const newTimes = selected ? form.times.filter(x => x !== t) : [...form.times, t]
    const newHours = { ...form.timeHours }
    if (!selected && !newHours[t]) newHours[t] = DEFAULT_HOURS[t]
    if (selected) delete newHours[t]
    setForm(p => ({ ...p, times: newTimes, timeHours: newHours }))
  }

  const setHour = (t, v) => setForm(p => ({ ...p, timeHours: { ...p.timeHours, [t]: v } }))

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
                ? <img src={form.photo} alt="med" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #30363d' }} />
                : <div style={{ width: 56, height: 56, borderRadius: 8, background: '#21262d', border: '1px dashed #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📷</div>
              }
              <button onClick={() => fileRef.current?.click()} style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', fontSize: 13, fontFamily: 'Heebo', cursor: 'pointer' }}>
                {form.photo ? 'החלף' : 'צלם / העלה'}
              </button>
              {form.photo && <button onClick={() => set('photo', null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 18, cursor: 'pointer' }}>🗑️</button>}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>
          </div>

          <Input label="שם תרופה *" value={form.name} onChange={v => set('name', v)} placeholder="לדוג׳ אמוקסיצילין" />
          <Input label="מינון" value={form.dose} onChange={v => set('dose', v)} placeholder='לדוג׳ 500מ"ג' />

          {/* Times + Hours */}
          <div>
            <label style={labelStyle}>זמני לקיחה ושעות</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIMES.map(t => {
                const selected = form.times.includes(t)
                return (
                  <div key={t} style={{
                    borderRadius: 10, border: `1px solid ${selected ? TIME_COLORS[t] + '66' : '#30363d'}`,
                    background: selected ? TIME_COLORS[t] + '12' : '#21262d',
                    overflow: 'hidden', transition: 'all 0.2s'
                  }}>
                    {/* Toggle row */}
                    <button onClick={() => toggleTime(t)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Heebo'
                    }}>
                      <span style={{ fontSize: 18 }}>{TIME_ICONS[t]}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: selected ? TIME_COLORS[t] : '#8b949e', flex: 1, textAlign: 'right' }}>{t}</span>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? TIME_COLORS[t] : '#6b7280'}`,
                        background: selected ? TIME_COLORS[t] : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                    </button>

                    {/* Hour picker – only when selected */}
                    {selected && (
                      <div style={{ padding: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#8b949e', flexShrink: 0 }}>🔔 שעת תזכורת:</span>
                        <input
                          type="time"
                          value={form.timeHours[t] || DEFAULT_HOURS[t]}
                          onChange={e => setHour(t, e.target.value)}
                          style={{
                            ...inputStyle, padding: '6px 10px', fontSize: 16,
                            fontWeight: 700, color: TIME_COLORS[t], width: 'auto',
                            background: '#0d1117', border: `1px solid ${TIME_COLORS[t]}44`
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Select label="הנחיות שימוש" value={form.instructions} onChange={v => set('instructions', v)} options={INSTRUCTIONS} />
          <Input label="תאריך תפוגה" value={form.expiry} onChange={v => set('expiry', v)} type="date" />

          {/* Stock */}
          <div style={{ background: '#21262d', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700, color: '#e6edf3' }}>📦 מעקב מלאי</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>כמות נוכחית</label>
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
