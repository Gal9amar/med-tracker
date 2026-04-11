import { useState, useRef } from 'react'
import { uid, PROFILE_AVATARS } from '../utils'
import { overlay, sheet, inputStyle, labelStyle } from './shared'

export default function ProfilesBar({ data, update }) {
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ name: '', avatar: '👤' })
  const longPressTimer = useRef(null)

  const openAdd = () => {
    setForm({ name: '', avatar: '👤' })
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setForm({ name: p.name, avatar: p.avatar })
    setEditTarget(p)
    setShowModal(true)
  }

  // Long press handlers
  const handlePressStart = (p) => {
    longPressTimer.current = setTimeout(() => openEdit(p), 600)
  }
  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
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
    if (!confirm('למחוק פרופיל זה? התרופות שלו יימחקו גם הן.')) return
    update(d => ({
      ...d,
      profiles: d.profiles.filter(p => p.id !== id),
      activeProfile: d.activeProfile === id ? d.profiles.find(p => p.id !== id)?.id : d.activeProfile,
      meds: d.meds.filter(m => m.profileId !== id),
      log: d.log.filter(l => l.profileId !== id)
    }))
    setShowModal(false)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 4px', scrollbarWidth: 'none' }}>
        {data.profiles.map(p => {
          const active = p.id === data.activeProfile
          return (
            <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => update(d => ({ ...d, activeProfile: p.id }))}
                onMouseDown={() => handlePressStart(p)}
                onMouseUp={handlePressEnd}
                onTouchStart={() => handlePressStart(p)}
                onTouchEnd={handlePressEnd}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? '#388bfd22' : '#21262d',
                  outline: active ? '2px solid #388bfd' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 22 }}>{p.avatar}</span>
                <span style={{
                  fontSize: 11, fontFamily: 'Heebo', fontWeight: 600,
                  color: active ? '#58a6ff' : '#8b949e',
                  maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{p.name}</span>
              </button>

              {/* Edit pencil – always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(p) }}
                title="ערוך פרופיל"
                style={{
                  position: 'absolute', top: -4, left: -4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#30363d', border: '1px solid #484f58',
                  cursor: 'pointer', fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8b949e', lineHeight: 1
                }}>
                ✏️
              </button>
            </div>
          )
        })}

        {/* Add profile */}
        <button onClick={openAdd} style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20, border: '1px dashed #30363d',
          background: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: 18 }}>➕</span>
          <span style={{ fontSize: 13, color: '#8b949e', fontFamily: 'Heebo', fontWeight: 600 }}>הוסף</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={overlay} onClick={() => setShowModal(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editTarget ? `ערוך – ${editTarget.name}` : 'פרופיל חדש'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>שם</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="לדוג׳ אבא, אמא, רון..."
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>אווטר</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PROFILE_AVATARS.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))} style={{
                      fontSize: 28, borderRadius: 8, padding: 6, cursor: 'pointer', transition: 'all 0.2s',
                      background: form.avatar === a ? '#388bfd22' : '#21262d',
                      border: form.avatar === a ? '2px solid #388bfd' : '2px solid transparent',
                    }}>{a}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} style={{
                background: '#388bfd', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
              }}>
                {editTarget ? '💾 שמור שינויים' : '✅ צור פרופיל'}
              </button>

              {editTarget && (
                <button onClick={() => handleDelete(editTarget.id)} style={{
                  background: '#21262d', color: '#ef4444',
                  border: '1px solid #ef444444', borderRadius: 8,
                  padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
                }}>
                  🗑️ מחק פרופיל
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
