import { useEffect, useMemo, useState } from 'react'

function isIos() {
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream
}

function isStandalone() {
  // iOS uses navigator.standalone; others use display-mode media query.
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState('other') // ios | other

  const canShow = useMemo(() => {
    if (isStandalone()) return false
    return true
  }, [])

  useEffect(() => {
    if (!canShow) return

    const ios = isIos()
    setPlatform(ios ? 'ios' : 'other')

    // On iOS Safari there is no beforeinstallprompt — show guidance once.
    if (ios) {
      const dismissed = localStorage.getItem('babycare_install_dismissed') === '1'
      if (!dismissed) setVisible(true)
      return
    }

    // On Chrome/Edge: show our popup even before beforeinstallprompt,
    // but enable the install button only after the event arrives.
    const dismissed = localStorage.getItem('babycare_install_dismissed') === '1'
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed2 = localStorage.getItem('babycare_install_dismissed') === '1'
      if (!dismissed2) setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [canShow])

  const dismiss = () => {
    localStorage.setItem('babycare_install_dismissed', '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      // userChoice is deprecated in some browsers, but still widely present.
      await deferredPrompt.userChoice?.catch?.(() => undefined)
    } finally {
      setDeferredPrompt(null)
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.62)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        fontFamily: 'Heebo',
        direction: 'rtl',
      }}
      onClick={dismiss}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#161b22',
          borderRadius: '22px 22px 0 0',
          border: '1px solid #30363d',
          borderBottom: 'none',
          padding: '18px 18px 28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 42, height: 4, background: '#30363d', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <img
            src="/images/BabyCareLogo.png"
            alt="BabyCare"
            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #30363d', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#e6edf3' }}>התקנת BabyCare</div>
            <div style={{ fontSize: 12, color: '#8b949e' }}>לקיצור דרך על המסך הראשי + חווית “אפליקציה”</div>
          </div>
        </div>

        {platform === 'ios' ? (
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 14, padding: 12, color: '#e6edf3', fontSize: 13, lineHeight: 1.7 }}>
            כדי להתקין באייפון:
            <div style={{ marginTop: 6, color: '#8b949e' }}>
              1) לחצו על כפתור <b>שיתוף</b> בספארי<br />
              2) בחרו <b>הוסף למסך הבית</b>
            </div>
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 14, padding: 12, color: '#8b949e', fontSize: 13, lineHeight: 1.7 }}>
            ניתן להתקין את האפליקציה למסך הבית. לאחר התקנה תקבלו חוויית מסך מלא וגישה מהירה.
            {!deferredPrompt && (
              <div style={{ marginTop: 8, color: '#6b7280' }}>
                אם כפתור ההתקנה אפור: נסו לרענן, או לפתוח תפריט ⋮ בדפדפן ולבחור “Install app”.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {platform !== 'ios' ? (
            <button
              onClick={install}
              disabled={!deferredPrompt}
              style={{
                flex: 2,
                padding: '12px 0',
                background: deferredPrompt ? '#a78bfa' : '#3b2f6e',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: 800,
                cursor: deferredPrompt ? 'pointer' : 'default',
                opacity: deferredPrompt ? 1 : 0.75,
              }}
            >
              ⬇️ התקן אפליקציה
            </button>
          ) : (
            <button
              onClick={dismiss}
              style={{
                flex: 2,
                padding: '12px 0',
                background: '#a78bfa',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              הבנתי
            </button>
          )}
          <button
            onClick={dismiss}
            style={{
              flex: 1,
              padding: '12px 0',
              background: '#21262d',
              color: '#e6edf3',
              border: '1px solid #30363d',
              borderRadius: 12,
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  )
}

