import { useState } from 'react'
import * as db from '../db'

export default function FamilySetup({ user, onFamilyCreated, onSignOut }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'הורה'

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    // Ensure member record exists (handles email-confirmed users who bypassed AuthScreen upsert)
    await db.upsertMember(user.id, user.email, displayName)
    const { data: family, error: err } = await db.createFamily(user.id, displayName)
    if (err) { setError(err.message); setLoading(false); return }
    onFamilyCreated(family)
  }

  const handleJoin = async () => {
    if (!code.trim()) { setError('הכניסו את קוד ההזמנה שקיבלתם'); return }
    setLoading(true)
    setError('')
    // Ensure member record exists before joining
    await db.upsertMember(user.id, user.email, displayName)
    const { data, error: err } = await db.joinByCode(code.trim(), user.id, displayName)
    if (err) { setError(err.message); setLoading(false); return }
    // Reload family
    const { data: fm } = await db.getUserFamily(user.id)
    if (fm?.families) onFamilyCreated(fm.families)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Heebo', direction: 'rtl', padding: 24
    }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>👨‍👩‍👧</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#f9a8d4', marginBottom: 4 }}>שלום {displayName}! 👋</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
        בואו נפתח את המשפחה שלכם באפליקציה 🏠
      </div>

      {mode === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <button onClick={() => setMode('create')} style={bigBtn('#a78bfa')}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div>
              <div style={{ fontWeight: 700 }}>פתחו משפחה חדשה</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>רק הגעתם? התחילו כאן ✨</div>
            </div>
          </button>
          <button onClick={() => setMode('join')} style={bigBtn('#60a5fa')}>
            <span style={{ fontSize: 24 }}>🔗</span>
            <div>
              <div style={{ fontWeight: 700 }}>הצטרפו למשפחה קיימת</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>קיבלתם קוד מהורה אחר? היכנסו כאן 🔗</div>
            </div>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', marginBottom: 8 }}>פותחים משפחה חדשה 🏠</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 20 }}>
              תוצרו יחידה משפחתית ותוכלו להזמין את ההורה השני בהמשך
            </div>
            {error && <div style={errStyle}>{error}</div>}
            <button onClick={handleCreate} disabled={loading} style={submitBtn}>
              {loading ? '...' : '✨ צור משפחה'}
            </button>
          </div>
          <button onClick={() => { setMode(null); setError('') }} style={backBtn}>← חזור</button>
        </div>
      )}

      {mode === 'join' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', marginBottom: 8 }}>הצטרפות למשפחה 🔗</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 16 }}>
              הכניסו את קוד ההזמנה שקיבלתם
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 10, padding: '12px 14px', color: '#e6edf3',
                fontFamily: 'Heebo', fontSize: 20, textAlign: 'center',
                letterSpacing: 8, outline: 'none', boxSizing: 'border-box',
                marginBottom: 16
              }}
            />
            {error && <div style={errStyle}>{error}</div>}
            <button onClick={handleJoin} disabled={loading} style={submitBtn}>
              {loading ? '...' : '🔗 הצטרף'}
            </button>
          </div>
          <button onClick={() => { setMode(null); setError('') }} style={backBtn}>← חזור</button>
        </div>
      )}

      <button onClick={onSignOut} style={{ marginTop: 32, background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'Heebo' }}>
        יציאה מהחשבון
      </button>
    </div>
  )
}

const bigBtn = (color) => ({
  display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right',
  background: color + '18', border: `1px solid ${color}40`, borderRadius: 16,
  padding: '16px 20px', cursor: 'pointer', fontFamily: 'Heebo', color: '#e6edf3',
  width: '100%'
})

const submitBtn = {
  width: '100%', padding: '13px 0', background: '#a78bfa',
  color: '#fff', border: 'none', borderRadius: 12,
  fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: 'pointer'
}

const backBtn = {
  marginTop: 12, background: 'none', border: 'none',
  color: '#8b949e', fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo'
}

const errStyle = {
  background: '#ef444418', border: '1px solid #ef444440', borderRadius: 8,
  padding: '8px 12px', fontSize: 13, color: '#ef4444', marginBottom: 12
}
