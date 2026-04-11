import { useState, useRef } from 'react'
import { uid } from '../utils'
import { overlay, sheet, inputStyle, labelStyle } from './shared'
import { AGE_CATEGORIES, AGE_AVATARS, getCategoryFromBirthDate, getAgeLabel } from '../ageProfiles'

function ProfileModal({ initial, onClose, onSave, onDelete, canDelete }) {
  const [form, setForm] = useState(initial || { name: '', avatar: '👶', ageCategory: 'baby', birthDate: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-derive category from birthDate
  const handleBirthDate = (val) => {
    const cat = getCategoryFromBirthDate(val)
    const defaultAvatar = AGE_AVATARS[cat]?.[0] || '👤'
    setForm(f => ({ ...f, birthDate: val, ageCategory: cat, avatar: f.avatar === f._lastDefaultAvatar ? defaultAvatar : f.avatar, _lastDefaultAvatar: defaultAvatar }))
    setError('')
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('נא להזין שם'); return }
    if (!form.birthDate) { setError('תאריך לידה הוא שדה חובה'); return }
    onSave(form)
  }

  const derivedCat = getCategoryFromBirthDate(form.birthDate)
  const catInfo = AGE_CATEGORIES.find(c => c.id === derivedCat) || AGE_CATEGORIES[4]
  const ageLabel = getAgeLabel(form.birthDate)
  const avatarOptions = AGE_AVATARS[derivedCat] || AGE_AVATARS.adult

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...sheet, maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{initial ? `ערוך – ${initial.name}` : 'הוסף בן משפחה'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>שם *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="לדוג׳ רון, מיה, אבא..." style={inputStyle} autoFocus />
          </div>

          {/* Birth date – REQUIRED */}
          <div>
            <label style={{ ...labelStyle, color: '#e6edf3', fontWeight: 700 }}>
              תאריך לידה * <span style={{ color: '#f59e0b', fontSize: 11 }}>(חובה – קובע את הקבוצה אוטומטית)</span>
            </label>
            <input type="date" value={form.birthDate} onChange={e => handleBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              style={{ ...inputStyle, border: form.birthDate ? '1px solid #30363d' : '1px solid #f59e0b' }} />
          </div>

          {/* Auto-derived category display */}
          {form.birthDate && (
            <div style={{ background: catInfo.color + '15', border: `1px solid ${catInfo.color}44`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{catInfo.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: catInfo.color }}>{catInfo.label}</div>
                <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                  {ageLabel} · {catInfo.range} שנים
                </div>
              </div>
              <span style={{ marginRight: 'auto', fontSize: 11, color: '#6b7280' }}>מחושב אוטומטית</span>
            </div>
          )}

          {/* Weight – only for babies/toddlers */}
          {(derivedCat === 'baby' || derivedCat === 'toddler') && (
            <div>
              <label style={{ ...labelStyle, fontWeight: 700, color: '#f9a8d4' }}>⚖️ משקל (ק"ג)</label>
              <input
                type="number" value={form.weight || ''}
                onChange={e => set('weight', e.target.value)}
                placeholder="לדוג׳ 5.2" step="0.1" min="1" max="15"
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'center' }}
              />
              {form.weight && (
                <p style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
                  כמות מומלצת: {Math.round(parseFloat(form.weight) * 150)}–{Math.round(parseFloat(form.weight) * 200)} מ"ל ביום
                </p>
              )}
            </div>
          )}

          {/* Avatar */}
          <div>
            <label style={labelStyle}>אווטר</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {avatarOptions.map(a => (
                <button key={a} onClick={() => set('avatar', a)} style={{
                  fontSize: 28, borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'all 0.2s',
                  background: form.avatar === a ? catInfo.color + '22' : '#21262d',
                  border: form.avatar === a ? `2px solid ${catInfo.color}` : '2px solid transparent',
                }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSave} style={{
            background: catInfo.color, color: '#fff', border: 'none', borderRadius: 8,
            padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
          }}>
            {initial ? '💾 שמור שינויים' : '✅ הוסף'}
          </button>

          {canDelete && onDelete && (
            <button onClick={onDelete} style={{
              background: '#21262d', color: '#ef4444', border: '1px solid #ef444433',
              borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
            }}>
              🗑️ מחק פרופיל
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProfilesBar({ data, update, forceOpen, editTarget: externalEditTarget, onClose }) {
  const [showModal, setShowModal] = useState(forceOpen || false)
  const [editTarget, setEditTarget] = useState(externalEditTarget || null)

  const openAdd = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (p) => { setEditTarget(p); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditTarget(null); onClose?.() }

  const handleSave = (form) => {
    // Always recalculate category from birthDate on save
    const ageCategory = getCategoryFromBirthDate(form.birthDate)
    const cleanForm = { name: form.name, avatar: form.avatar, birthDate: form.birthDate, ageCategory, weight: form.weight || null }

    if (editTarget) {
      update(d => ({ ...d, profiles: d.profiles.map(p => p.id === editTarget.id ? { ...p, ...cleanForm } : p) }))
    } else {
      const newId = uid()
      update(d => ({ ...d, profiles: [...d.profiles, { id: newId, ...cleanForm }], activeProfile: newId }))
    }
    closeModal()
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
    closeModal()
  }

  return (
    <>
      {showModal && (
        <ProfileModal
          initial={editTarget}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={editTarget ? () => handleDelete(editTarget.id) : null}
          canDelete={editTarget && data.profiles.length > 1}
        />
      )}
    </>
  )
}

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
            // Always derive category live from birthDate
            const catId = getCategoryFromBirthDate(p.birthDate) || p.ageCategory || 'adult'
            const cat = AGE_CATEGORIES.find(c => c.id === catId) || AGE_CATEGORIES[4]
            const ageLabel = getAgeLabel(p.birthDate)
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
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {cat.label}{ageLabel ? ` · ${ageLabel}` : ''}
                  </div>
                </div>
                {active && <span style={{ fontSize: 11, color: cat.color, fontWeight: 700 }}>פעיל ✓</span>}
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
