import { useState } from 'react'
import * as db from '../db'

export default function HamburgerMenu({ user, family, babies, onClose, onSignOut, onManageBabies, onOpenVaccinations }) {
  const [view, setView] = useState('main') // 'main' | 'invite'
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0]

  const handleGenerateCode = async () => {
    setInviteLoading(true)
    setInviteError('')
    const { data, error } = await db.createInviteCode(family.id, user.id)
    if (error) { setInviteError(error.message); setInviteLoading(false); return }
    setInviteCode(data.code)
    setInviteLoading(false)
  }

  const handleExport = () => {
    const text = babies.map(b => `👶 ${b.name} | ${b.birth_date}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'babycare-export.txt'
    a.click()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'flex-start',
      fontFamily: 'Heebo', direction: 'rtl'
    }} onClick={onClose}>
      <div style={{
        width: 300, height: '100%', background: '#161b22',
        borderLeft: '1px solid #30363d', padding: 0,
        display: 'flex', flexDirection: 'column', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: '#0d1117', padding: '20px 20px 16px', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f9a8d4' }}>תפריט</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#a78bfa33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        {view === 'main' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Family info */}
            <div style={{ background: '#0d1117', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>יחידה משפחתית</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>👨‍👩‍👧 {family?.name}</div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{babies.length} תינוק/ים</div>
            </div>

            <MenuItem icon="👶" label="ניהול תינוקות" onClick={onManageBabies} />
            <MenuItem icon="💉" label="פנקס חיסונים" onClick={onOpenVaccinations} />
            <MenuItem icon="🔗" label="הזמן הורה לשיתוף" onClick={() => setView('invite')} />
            <MenuItem icon="📤" label="ייצוא נתונים" onClick={handleExport} />

            <div style={{ height: 1, background: '#30363d', margin: '8px 0' }} />

            <MenuItem icon="🚪" label="יציאה מהחשבון" onClick={onSignOut} color="#ef4444" />
          </div>
        )}

        {view === 'invite' && (
          <div style={{ padding: 20 }}>
            <button onClick={() => { setView('main'); setInviteCode(''); setInviteError('') }} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo', marginBottom: 16 }}>
              ← חזור
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 8 }}>הזמן הורה</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
              צור קוד הזמנה חד-פעמי (תקף 48 שעות).<br />
              ההורה השני ייכנס לאפליקציה, יירשם, ויכניס את הקוד.
            </div>

            {!inviteCode ? (
              <>
                {inviteError && <div style={errStyle}>{inviteError}</div>}
                <button onClick={handleGenerateCode} disabled={inviteLoading} style={{
                  width: '100%', padding: '13px 0', background: '#a78bfa',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>
                  {inviteLoading ? '...' : '🔗 צור קוד הזמנה'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 12 }}>קוד ההזמנה:</div>
                <div style={{
                  background: '#0d1117', border: '2px solid #a78bfa', borderRadius: 16,
                  padding: '20px 0', fontSize: 36, fontWeight: 800, letterSpacing: 12,
                  color: '#a78bfa', marginBottom: 16
                }}>
                  {inviteCode}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>תקף ל-48 שעות · שימוש חד-פעמי</div>
                <button onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{
                  background: '#21262d', border: '1px solid #30363d', borderRadius: 10,
                  padding: '10px 20px', color: '#e6edf3', fontFamily: 'Heebo', fontSize: 13,
                  cursor: 'pointer'
                }}>📋 העתק קוד</button>
                <br />
                <button onClick={() => setInviteCode('')} style={{ marginTop: 12, background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'Heebo' }}>
                  צור קוד חדש
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'none', border: 'none', borderRadius: 10,
      padding: '12px 10px', cursor: 'pointer', fontFamily: 'Heebo',
      color: color || '#e6edf3', fontSize: 14, width: '100%', textAlign: 'right'
    }}>
      <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
      {label}
    </button>
  )
}

const errStyle = {
  background: '#ef444418', border: '1px solid #ef444440',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#ef4444', marginBottom: 12
}
