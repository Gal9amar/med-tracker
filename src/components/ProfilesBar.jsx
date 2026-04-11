import { useState, useRef } from 'react'
import { uid } from '../utils'
import { overlay, sheet, inputStyle, labelStyle } from './shared'
import { AGE_CATEGORIES, AGE_AVATARS } from '../ageProfiles'

export default function ProfilesBar({ data, update, onOpenFamily, forceOpen, editTarget: externalEditTarget, onClose }) {
  const [showModal, setShowModal] = useState(forceOpen || false)
  const [editTarget, setEditTarget] = useState(externalEditTarget || null)
  const [form, setForm] = useState({ name: '', avatar: '👤', ageCategory: 'adult', birthDate: '' })

  const openAdd = () => {
    setForm({ name: '', avatar: '👤', ageCategory: 'adult', birthDate: '' })
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setForm({ name: p.name, avatar: p.avatar, ageCategory: p.ageCategory || 'adult', birthDate: p.birthDate || '' })
    setEditTarget(p)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    const cat = AGE_CATEGORIES.find(c => c.id === form.ageCategory)
    if (editTarget) {
      update(d => ({ ...d, profiles: d.profiles.map(p => p.id === editTarget.id ? { ...p, ...form } : p) }))
    } else {
      const newId = uid()
      update(d => ({ ...d, profiles: [...d.profiles, { id: newId, ...form }], activeProfile: newId }))
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (data.profiles.length === 1) { alert('לא ניתן למחוק את הפרופיל האחרון'); return }
    if (!confirm('למחוק פרופיל זה? כל הנתונים שלו יימחקו.')) return
    update(d => ({
      ...d,
      profiles: d.profiles.filter(p => p.id !== id),
      activeProfile: d.activeProfile === id ? d.profiles.find(p => p.id !== id)?.id : d.activeProfile,
      meds: d.meds.filter(m => m.profileId !== id),
      log: d.log.filter(l => l.profileId !== id),
      babyLog: (d.babyLog || []).filter(l => l.profileId !== id),
    }))
    setShowModal(false)
  }

  const selectedCat = AGE_CATEGORIES.find(c => c.id === form.ageCategory)
  const avatarOptions = AGE_AVATARS[form.ageCategory] || ['👤']

  return (
    <>
      {/* Family button – opens modal passed from parent */}
      <button onClick={onOpenFamily} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 20, border: '1px solid #30363d',
        background: '#21262d', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
      }}>
        <span style={{ fontSize: 16 }}>👨‍👩‍👧</span>
        <span style={{ fontSize: 13, color: '#c9d1d9', fontFamily: 'Heebo', fontWeight: 600 }}>משפחה</span>
        <span style={{ background: '#388bfd', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
          {data.profiles.length}
        </span>
      </button>

      {/* Family modal – opened from Header */}
      {showModal && (
        <div style={overlay} onClick={() => { setShowModal(false); onClose?.() }}>
          <div style={{ ...sheet, maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editTarget ? `ערוך – ${editTarget.name}` : 'פרופיל חדש'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>שם</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="לדוג׳ תינוקת מיה, אבא..." style={inputStyle} autoFocus />
              </div>

              {/* Age category */}
              <div>
                <label style={labelStyle}>קטגוריית גיל</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {AGE_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => {
                      const firstAvatar = AGE_AVATARS[cat.id]?.[0] || '👤'
                      setForm(f => ({ ...f, ageCategory: cat.id, avatar: firstAvatar }))
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderRadius: 10, border: `2px solid ${form.ageCategory === cat.id ? cat.color : '#30363d'}`,
                      background: form.ageCategory === cat.id ? cat.color + '18' : '#21262d',
                      cursor: 'pointer', fontFamily: 'Heebo', transition: 'all 0.2s'
                    }}>
                      <span style={{ fontSize: 22 }}>{cat.icon}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: form.ageCategory === cat.id ? cat.color : '#c9d1d9' }}>{cat.label}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{cat.range}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Birth date */}
              <div>
                <label style={labelStyle}>תאריך לידה (אופציונלי)</label>
                <input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} style={inputStyle} />
              </div>

              {/* Avatar */}
              <div>
                <label style={labelStyle}>אווטר</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {avatarOptions.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))} style={{
                      fontSize: 28, borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'all 0.2s',
                      background: form.avatar === a ? (selectedCat?.color || '#388bfd') + '22' : '#21262d',
                      border: form.avatar === a ? `2px solid ${selectedCat?.color || '#388bfd'}` : '2px solid transparent',
                    }}>{a}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} style={{
                background: selectedCat?.color || '#388bfd', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
              }}>
                {editTarget ? '💾 שמור שינויים' : '✅ צור פרופיל'}
              </button>

              {editTarget && (
                <button onClick={() => handleDelete(editTarget.id)} style={{
                  background: '#21262d', color: '#ef4444', border: '1px solid #ef444433',
                  borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
                }}>
                  🗑️ מחק פרופיל
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expose open for family panel */}

    </>
  )
}

// Family panel – shown from Header
export function FamilyPanel({ data, update, onClose, onOpenAddProfile }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>👨‍👩‍👧 המשפחה שלי</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {data.profiles.map(p => {
            const active = p.id === data.activeProfile
            const cat = AGE_CATEGORIES.find(c => c.id === p.ageCategory) || AGE_CATEGORIES[4]
            return (
              <button key={p.id} onClick={() => { update(d => ({ ...d, activeProfile: p.id })); onClose() }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `2px solid ${active ? cat.color : '#30363d'}`,
                background: active ? cat.color + '15' : '#21262d', cursor: 'pointer',
                width: '100%', textAlign: 'right', fontFamily: 'Heebo'
              }}>
                <span style={{ fontSize: 28 }}>{p.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: active ? cat.color : '#e6edf3' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{cat.label} · {cat.range}</div>
                </div>
                {active && <span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>פעיל ✓</span>}
                <button onClick={e => { e.stopPropagation(); onOpenAddProfile(p) }} style={{
                  background: '#30363d', border: 'none', borderRadius: 6, padding: '4px 8px',
                  fontSize: 12, color: '#8b949e', cursor: 'pointer', fontFamily: 'Heebo'
                }}>✏️</button>
              </button>
            )
          })}
        </div>
        <button onClick={() => { onOpenAddProfile(null); onClose() }} style={{
          width: '100%', background: '#388bfd', color: '#fff', border: 'none', borderRadius: 10,
          padding: '12px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
        }}>
          ➕ הוסף בן משפחה
        </button>
      </div>
    </div>
  )
}
