import { useState } from 'react'
import { supabase } from '../supabase'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleForgotPassword = async () => {
    setError('')
    setInfo('')
    if (!email.trim()) { setError('הכניסו את כתובת המייל שלכם כדי לאפס סיסמה'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setInfo('שלחנו לכם מייל עם קישור לאיפוס הסיסמה — בדקו את תיבת הדואר 💌')
  }

  const handleSubmit = async () => {
    setError('')
    setInfo('')
    if (!email || !password) { setError('נשמח אם תמלאו אימייל וסיסמה 😊'); return }
    if (password.length < 6) { setError('הסיסמה צריכה להיות לפחות 6 תווים'); return }
    setLoading(true)

    if (mode === 'register') {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() || email.split('@')[0] } }
      })
      if (err) { setError(err.message); setLoading(false); return }
      // Auto-confirm is off by default → tell user to check email
      if (data.user && !data.session) {
        setInfo('שלחנו אימייל אימות — בדקו את תיבת הדואר ולחצו על הקישור 💌')
        setLoading(false)
        return
      }
      // If email confirm disabled in Supabase → session exists immediately
      if (data.session) onAuth(data.session.user)
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (err) {
        if (err.message.includes('Invalid login')) setError('האימייל או הסיסמה לא נכונים, נסו שוב')
        else if (err.message.includes('Email not confirmed')) setError('צריך לאמת את האימייל קודם — בדקו את תיבת הדואר')
        else setError(err.message)
        setLoading(false)
        return
      }
      onAuth(data.user)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Heebo', direction: 'rtl', padding: 24
    }}>
      {/* Logo */}
      <div style={{ fontSize: 64, marginBottom: 8 }}>👶</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#c4b5fd', marginBottom: 4 }}>BabyCare</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>הכל במקום אחד — בשבילכם ובשביל התינוק 💜</div>

      {/* Card */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 360
      }}>
        {/* Mode toggle — only for login/register */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', background: '#0d1117', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setInfo('') }} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'Heebo', fontSize: 14, fontWeight: 600,
                background: mode === m ? '#a78bfa' : 'transparent',
                color: mode === m ? '#fff' : '#6b7280',
                transition: 'all 0.2s'
              }}>
                {m === 'login' ? 'כניסה' : 'הרשמה'}
              </button>
            ))}
          </div>
        )}

        {/* Forgot password mode */}
        {mode === 'forgot' && (
          <>
            <button onClick={() => { setMode('login'); setError(''); setInfo('') }} style={{
              background: 'none', border: 'none', color: '#8b949e', fontSize: 13,
              cursor: 'pointer', fontFamily: 'Heebo', marginBottom: 16, padding: 0
            }}>← חזרה לכניסה</button>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#e6edf3', marginBottom: 6 }}>איפוס סיסמה 🔑</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
              הכניסו את כתובת המייל שלכם ונשלח לכם קישור לבחירת סיסמה חדשה.
            </div>
          </>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>שם מלא</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>אימייל</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && (mode === 'forgot' ? handleForgotPassword() : handleSubmit())}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label style={labelStyle}>סיסמה</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'לפחות 6 תווים' : '••••••••'}
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}
        </div>

        {/* Error / Info */}
        {error && (
          <div style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#ef4444' }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: '#22c55e18', border: '1px solid #22c55e40', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#22c55e' }}>
            {info}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={mode === 'forgot' ? handleForgotPassword : handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 20, padding: '13px 0',
            background: loading ? '#3b2f6e' : '#a78bfa',
            color: '#fff', border: 'none', borderRadius: 12,
            fontFamily: 'Heebo', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s'
          }}
        >
          {loading ? '...' : mode === 'login' ? 'כניסה' : mode === 'register' ? 'יצירת חשבון' : 'שלחו לי קישור לאיפוס'}
        </button>

        {/* Forgot password link — only on login */}
        {mode === 'login' && (
          <button onClick={() => { setMode('forgot'); setError(''); setInfo('') }} style={{
            width: '100%', marginTop: 12, background: 'none', border: 'none',
            color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo'
          }}>
            שכחתם סיסמה?
          </button>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#374151', marginTop: 24, textAlign: 'center' }}>
        הנתונים שלכם מאובטחים ונשמרים בפרטיות — רק בני המשפחה רואים אותם 🔒
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6, fontWeight: 600
}
const inputStyle = {
  width: '100%', background: '#0d1117', border: '1px solid #30363d',
  borderRadius: 10, padding: '11px 13px', color: '#e6edf3',
  fontFamily: 'Heebo', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', direction: 'ltr', textAlign: 'left'
}
