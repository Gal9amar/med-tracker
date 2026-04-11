import { TIMES, TIME_ICONS, TIME_COLORS, daysUntilExpiry, expiryColor, expiryLabel } from '../utils'

function getGreeting(name) {
  const h = new Date().getHours()
  if (h < 6)  return { greeting: `לילה טוב, ${name}`, sub: 'תנוח טוב – הבריאות שלך חשובה לנו 🌙', icon: '🌙' }
  if (h < 12) return { greeting: `בוקר טוב, ${name}`, sub: 'נתחיל את היום עם הטיפול שלך ☀️', icon: '☀️' }
  if (h < 17) return { greeting: `צהריים טובים, ${name}`, sub: 'בדוק שלקחת את כל התרופות של הבוקר 🌤', icon: '🌤' }
  if (h < 21) return { greeting: `ערב טוב, ${name}`, sub: 'סוף יום – איך הרגשת היום? 🌆', icon: '🌆' }
  return { greeting: `לילה טוב, ${name}`, sub: 'לפני שתלך לישון – בדוק שלקחת הכל 🌙', icon: '🌙' }
}

function getCareMessage(pct, name) {
  if (pct === 100) return { text: `מעולה ${name}! לקחת את כל התרופות היום 🎉`, color: '#22c55e', bg: '#22c55e12' }
  if (pct >= 50)   return { text: `יפה ${name}, ממשיכים – נשאר עוד קצת 💪`, color: '#58a6ff', bg: '#58a6ff12' }
  if (pct > 0)     return { text: `${name}, יש עוד תרופות שמחכות לך – אנחנו כאן 🙏`, color: '#f59e0b', bg: '#f59e0b12' }
  return { text: `${name}, נתחיל את היום בטיפול בעצמנו ❤️`, color: '#8b949e', bg: '#ffffff08' }
}

export default function TodayTab({ data, isTaken, toggleTaken, pct, takenDoses, totalDoses, stockAlerts, profileName, inventory }) {
  const grouped = TIMES.map(time => ({
    time, meds: data.meds.filter(m => m.times?.includes(time))
  })).filter(g => g.meds.length > 0)

  const { greeting, sub } = getGreeting(profileName)
  const msg = getCareMessage(pct, profileName)

  // Inventory alerts (expiry)
  const inventoryAlerts = (inventory || []).filter(i => {
    const d = daysUntilExpiry(i.expiry)
    return d !== null && d <= 30
  })

  return (
    <div>

      {/* ── GREETING ── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', letterSpacing: -0.5, lineHeight: 1.2 }}>{greeting}</h2>
        <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{sub}</p>
      </div>

      {/* ── CARE MESSAGE ── */}
      <div style={{ background: msg.bg, border: `1px solid ${msg.color}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: msg.color, lineHeight: 1.5 }}>{msg.text}</p>
      </div>

      {/* ── STOCK ALERTS ── */}
      {stockAlerts?.length > 0 && (
        <div style={{ background: '#ef444412', border: '1px solid #ef444440', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ מלאי נמוך – כדאי לחדש</p>
          {stockAlerts.map(m => (
            <p key={m.id} style={{ fontSize: 12, color: '#fca5a5', marginTop: 2 }}>
              {m.name} – נשארו {m.stockCount} טבליות בלבד
            </p>
          ))}
        </div>
      )}

      {/* ── PROGRESS ── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#8b949e' }}>ההתקדמות שלך היום</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? '#22c55e' : '#58a6ff' }}>{pct}%</span>
        </div>
        <div style={{ background: '#30363d', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
            background: pct === 100
              ? 'linear-gradient(90deg,#22c55e,#16a34a)'
              : 'linear-gradient(90deg,#58a6ff,#388bfd)'
          }} />
        </div>
        <p style={{ fontSize: 12, color: '#8b949e', marginTop: 8 }}>
          {takenDoses === 0 ? 'עדיין לא לקחת תרופות היום' : `לקחת ${takenDoses} מתוך ${totalDoses} מנות`}
        </p>
      </div>

      {/* ── MEDS BY TIME ── */}
      {grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0 40px', color: '#8b949e' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>💊</div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>אין תרופות מוגדרות עדיין</p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#6b7280' }}>עבור ל"הטיפול שלך" כדי להוסיף</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            התרופות שלך להיום
          </p>
          {grouped.map(({ time, meds }) => (
            <div key={time} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{TIME_ICONS[time]}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: TIME_COLORS[time] }}>{time}</span>
                <span style={{ fontSize: 11, color: '#6b7280', marginRight: 'auto' }}>
                  {meds.filter(m => isTaken(m.id, time)).length}/{meds.length} נלקחו
                </span>
              </div>
              {meds.map(med => {
                const taken = isTaken(med.id, time)
                return (
                  <div key={med.id + time} style={{
                    background: '#161b22', borderRadius: 12, padding: '13px 14px', marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.25s',
                    border: `1px solid ${taken ? '#238636' : '#30363d'}`,
                    opacity: taken ? 0.68 : 1,
                  }}>
                    {med.photo
                      ? <img src={med.photo} alt={med.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #30363d' }} />
                      : <div style={{ width: 12, height: 12, borderRadius: '50%', background: med.color || '#58a6ff', flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, textDecoration: taken ? 'line-through' : 'none', color: taken ? '#8b949e' : '#e6edf3' }}>{med.name}</div>
                      {med.dose && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 1 }}>{med.dose}</div>}
                      {med.instructions && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>📋 {med.instructions}</div>}
                    </div>
                    <button onClick={() => toggleTaken(med.id, time)} style={{
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      padding: '7px 14px',
                      background: taken ? '#238636' : '#388bfd',
                      color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Heebo',
                      transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap'
                    }}>
                      {taken ? '✓ נלקח' : 'לקחתי'}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}

      {/* ── DIVIDER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 20px' }}>
        <div style={{ flex: 1, height: 1, background: '#30363d' }} />
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>🏠 ארון התרופות בבית</span>
        <div style={{ flex: 1, height: 1, background: '#30363d' }} />
      </div>

      {/* ── INVENTORY SECTION ── */}
      {(!inventory || inventory.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '24px 0 32px', color: '#8b949e' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>ארון התרופות ריק</p>
          <p style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>הוסף תרופות מהטאב "ארון התרופות"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
          {inventoryAlerts.length > 0 && (
            <div style={{ background: '#f59e0b12', border: '1px solid #f59e0b33', borderRadius: 10, padding: '10px 12px', marginBottom: 4 }}>
              <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>⚠️ תרופות שעומדות לפוג בקרוב</p>
            </div>
          )}
          {inventory.map(item => {
            const days = daysUntilExpiry(item.expiry)
            const ec = expiryColor(days)
            const isAlert = days !== null && days <= 30
            return (
              <div key={item.id} style={{
                background: '#161b22', borderRadius: 12, padding: '12px 14px',
                border: `1px solid ${isAlert ? ec + '44' : '#30363d'}`,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>💊</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    {item.quantity && <span style={{ fontSize: 11, color: '#8b949e' }}>📦 {item.quantity}</span>}
                    {item.location && <span style={{ fontSize: 11, color: '#8b949e' }}>📍 {item.location}</span>}
                    {item.instructions && <span style={{ fontSize: 11, color: '#f59e0b' }}>📋 {item.instructions}</span>}
                  </div>
                </div>
                {days !== null && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ec }}>{expiryLabel(days)}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>תוקף</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
