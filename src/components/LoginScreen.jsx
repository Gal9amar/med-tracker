import { useState } from 'react'
import { hashPin, verifyPin } from '../utils'

export default function LoginScreen({ pinHash, onUnlock, onSetPin, onSkip, onReset }) {
  const [mode, setMode] = useState(pinHash ? 'enter' : 'setup') // 'setup' | 'enter' | 'confirm' | 'forgot'
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  const handleDigit = (d) => {
    setError('')
    if (mode === 'confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + d
        setConfirmPin(next)
        if (next.length === 4) handleConfirm(next)
      }
    } else {
      if (pin.length < 4) {
        const next = pin + d
        setPin(next)
        if (next.length === 4) {
          if (mode === 'enter') handleEnter(next)
          else if (mode === 'setup') setMode('confirm')
        }
      }
    }
  }

  const handleDelete = () => {
    setError('')
    if (mode === 'confirm') setConfirmPin(p => p.slice(0, -1))
    else setPin(p => p.slice(0, -1))
  }

  const handleEnter = async (p) => {
    setLoading(true)
    const ok = await verifyPin(p, pinHash)
    setLoading(false)
    if (ok) {
      onUnlock()
    } else {
      setError('PIN שגוי, נסה שוב')
      setPin('')
    }
  }

  const handleConfirm = async (p) => {
    if (p !== pin) {
      setError('הPIN לא תואם, נסה שוב')
      setPin('')
      setConfirmPin('')
      setMode('setup')
      return
    }
    setLoading(true)
    const hash = await hashPin(p)
    setLoading(false)
    onSetPin(hash)
  }

  const currentPin = mode === 'confirm' ? confirmPin : pin

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0d1117',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Heebo, sans-serif', direction: 'rtl'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>👶</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f9a8d4', letterSpacing: 1 }}>BabyCare</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>מעקב טיפול בתינוקות</div>
      </div>

      {/* Mode Title */}
      {!resetConfirm && (
        <div style={{ fontSize: 15, color: '#e6edf3', marginBottom: 24, fontWeight: 600 }}>
          {mode === 'setup'   && 'צור PIN להגנה על האפליקציה'}
          {mode === 'confirm' && 'אשר את ה-PIN שלך'}
          {mode === 'enter'   && 'הזן את ה-PIN שלך'}
        </div>
      )}

      {/* Reset Confirm Dialog */}
      {resetConfirm ? (
        <div style={{ background: '#161b22', border: '1px solid #ef444444', borderRadius: 16, padding: 24, maxWidth: 300, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>איפוס כל הנתונים</div>
          <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
            פעולה זו תמחק את כל נתוני האפליקציה לצמיתות, כולל כל מעקב התינוקות.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setResetConfirm(false)} style={{ ...btnStyle('#30363d'), flex: 1 }}>ביטול</button>
            <button onClick={onReset} style={{ ...btnStyle('#ef4444'), flex: 1 }}>מחק הכל</button>
          </div>
        </div>
      ) : (
        <>
          {/* PIN Dots */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: '50%',
                background: i < currentPin.length ? '#a78bfa' : 'transparent',
                border: `2px solid ${i < currentPin.length ? '#a78bfa' : '#30363d'}`,
                transition: 'all 0.15s'
              }} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>
          )}

          {/* Numpad */}
          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
                <button key={i} onClick={() => d === '⌫' ? handleDelete() : d !== '' && handleDigit(String(d))}
                  disabled={d === ''}
                  style={{
                    width: 70, height: 70, borderRadius: '50%', border: 'none',
                    background: d === '' ? 'transparent' : '#161b22',
                    color: d === '⌫' ? '#a78bfa' : '#e6edf3',
                    fontSize: d === '⌫' ? 20 : 22, fontWeight: 700,
                    cursor: d === '' ? 'default' : 'pointer',
                    fontFamily: 'Heebo',
                    boxShadow: d !== '' ? '0 2px 8px #00000040' : 'none',
                    transition: 'background 0.1s'
                  }}
                >{d}</button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ color: '#a78bfa', fontSize: 13, marginBottom: 24 }}>מאמת...</div>
          )}

          {/* Skip / Forgot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {mode === 'setup' && (
              <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo' }}>
                דלג, אין צורך ב-PIN
              </button>
            )}
            {mode === 'enter' && (
              <button onClick={() => setResetConfirm(true)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'Heebo' }}>
                שכחתי את ה-PIN (מחיקת נתונים)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const btnStyle = (bg) => ({
  background: bg, border: 'none', borderRadius: 10,
  padding: '10px 0', fontSize: 14, fontWeight: 700,
  color: '#fff', cursor: 'pointer', fontFamily: 'Heebo'
})
