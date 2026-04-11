import { useState } from 'react'
import { INSTRUCTIONS } from '../utils'
import { Input, Select, overlay, sheet, btnPrimary } from './shared'

export default function InventoryModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', quantity: '', location: '', instructions: '', notes: '', expiry: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{initial ? 'ערוך פריט' : 'הוסף לתרופות הבית'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="שם תרופה *" value={form.name} onChange={v => set('name', v)} placeholder="לדוג׳ אקמול" />
          <Input label="כמות" value={form.quantity} onChange={v => set('quantity', v)} placeholder="לדוג׳ 20 טבליות" />
          <Input label="מיקום אחסון" value={form.location} onChange={v => set('location', v)} placeholder="לדוג׳ ארון תרופות במטבח" />
          <Select label="הנחיות שימוש" value={form.instructions} onChange={v => set('instructions', v)} options={INSTRUCTIONS} />
          <Input label="תאריך תפוגה" value={form.expiry} onChange={v => set('expiry', v)} type="date" />
          <Input label="הערות" value={form.notes} onChange={v => set('notes', v)} placeholder="מיועד ל / הערות..." />
          <button onClick={() => { if (!form.name.trim()) { alert('נא להזין שם'); return } onSave(form) }} style={{ ...btnPrimary, marginTop: 4 }}>
            {initial ? 'שמור' : 'הוסף'}
          </button>
        </div>
      </div>
    </div>
  )
}
