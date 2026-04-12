import { useState, useEffect } from 'react'
import { requestPermission, scheduleAllNotifications } from '../notifications'

const NOTIF_TYPES = [
  { key: 'feeding',   icon: '🍼', title: 'האכלה הבאה',      desc: 'תזכורת לפי מרווחי האכלה שהוגדרו' },
  { key: 'meds',      icon: '💊', title: 'תרופות מתוזמנות',  desc: 'לפי שעות נטילה שהוגדרו בכרטיס הבריאות' },
  { key: 'vaccines',  icon: '💉', title: 'חיסונים',          desc: 'יום לפני ובו ביום — כולל איחורים' },
  { key: 'temp',      icon: '🌡️', title: 'מעקב חום',         desc: 'בדיקת חום כל שעתיים בזמן קדחת' },
  { key: 'fever_med', icon: '💊', title: 'מנת חום הבאה',     desc: 'כשמותר לתת פרצטמול / איבופרופן שוב' },
]

export default function NotificationsButton({
  activeBaby, babyLog, meds, vaccinations,
  notifPrefs, onSavePrefs   // prefs object + save handler from App.jsx
}) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [showPanel, setShowPanel] = useState(false)
  const [draft, setDraft]         = useState(null)
  const [saving, setSaving]       = useState(false)

  const isGranted = permission === 'granted'

  // Re-schedule whenever data or prefs change
  useEffect(() => {
    if (isGranted) {
      scheduleAllNotifications({ activeBaby, babyLog, meds, vaccinations, prefs: notifPrefs })
    }
  }, [activeBaby, babyLog, meds, vaccinations, permission, notifPrefs])

  const openPanel = () => {
    setDraft({ ...notifPrefs })
    setShowPanel(true)
  }

  const handleClose = () => {
    setDraft(null)
    setShowPanel(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSavePrefs(draft)
    setSaving(false)
    setDraft(null)
    setShowPanel(false)
  }

  const handleEnable = async () => {
    const granted = await requestPermission()
    const perm = granted ? 'granted' : 'denied'
    setPermission(perm)
    if (granted) {
      scheduleAllNotifications({ activeBaby, babyLog, meds, vaccinations, prefs: notifPrefs })
    }
  }

  const toggleDraft = (key) => {
    setDraft(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const activeCount = Object.values(notifPrefs || {}).filter(Boolean).length

  return (
    <>
      <button
        onClick={openPanel}
        title={isGranted ? 'התראות פעילות' : 'הפעל התראות'}
        style={{
          background: isGranted ? '#22c55e22' : '#21262d',
          border: `1px solid ${isGranted ? '#22c55e44' : '#30363d'}`,
          borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {isGranted ? '🔔' : '🔕'}
      </button>

      {showPanel && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            fontFamily: 'Heebo', direction: 'rtl'
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: '#161b22', borderRadius: '20px 20px 0 0',
              border: '1px solid #30363d', borderBottom: 'none',
              padding: '20px 20px 36px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: '#30363d', borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ fontSize: 16, fontWeight: 800, color: '#e6edf3', marginBottom: 2 }}>
              🔔 הגדרות התראות
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
              בחר אילו התראות לקבל עבור {activeBaby?.name || 'התינוק'}
            </div>

            {/* Notification types with toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {NOTIF_TYPES.map(t => (
                <NotifRow
                  key={t.key}
                  icon={t.icon}
                  title={t.title}
                  desc={t.desc}
                  enabled={draft ? !!draft[t.key] : !!(notifPrefs?.[t.key])}
                  canToggle={isGranted}
                  onToggle={() => isGranted && toggleDraft(t.key)}
                />
              ))}
            </div>

            {!isGranted ? (
              <button
                onClick={handleEnable}
                style={{
                  width: '100%', padding: '14px 0',
                  background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 14,
                  fontFamily: 'Heebo', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}
              >
                🔔 הפעל התראות
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2, padding: '13px 0',
                    background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 12,
                    fontFamily: 'Heebo', fontSize: 14, fontWeight: 700,
                    cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? '...' : '✅ שמור הגדרות'}
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    flex: 1, padding: '13px 0',
                    background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 12,
                    fontFamily: 'Heebo', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 12 }}>
              {isGranted
                ? `✅ ${activeCount} מתוך ${NOTIF_TYPES.length} התראות פעילות`
                : 'נדרשת הרשאה — לחץ "הפעל" ואשר בדפדפן'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NotifRow({ icon, title, desc, enabled, canToggle, onToggle }) {
  return (
    <div
      onClick={canToggle ? onToggle : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#0d1117', borderRadius: 10, padding: '10px 12px',
        cursor: canToggle ? 'pointer' : 'default',
        opacity: canToggle ? 1 : 0.6,
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: enabled ? '#e6edf3' : '#6b7280' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{desc}</div>
      </div>
      {/* Toggle switch */}
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: enabled ? '#22c55e' : '#374151',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s'
      }}>
        <div style={{
          position: 'absolute', top: 3,
          right: enabled ? 3 : undefined,
          left: enabled ? undefined : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s, right 0.2s'
        }} />
      </div>
    </div>
  )
}
