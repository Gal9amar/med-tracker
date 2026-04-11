import { TIMES, TIME_ICONS, TIME_COLORS } from '../utils'

function getCareMessage(pct, name) {
  if (pct === 100) return { text: `מעולה ${name}! לקחת הכל היום 🎉`, color: '#22c55e' }
  if (pct >= 50)  return { text: `יפה ${name}, ממשיכים כך 💪`, color: '#58a6ff' }
  if (pct > 0)    return { text: `${name}, יש עוד תרופות שמחכות לך 🙏`, color: '#f59e0b' }
  return { text: `${name}, נתחיל את היום בטיפול בעצמנו ❤️`, color: '#8b949e' }
}

export default function TodayTab({ data, isTaken, toggleTaken, pct, takenDoses, totalDoses, stockAlerts, profileName }) {
  const grouped = TIMES.map(time => ({
    time, meds: data.meds.filter(m => m.times?.includes(time))
  })).filter(g => g.meds.length > 0)

  const msg = getCareMessage(pct, profileName)

  return (
    <div>
      {/* Care message */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: msg.color, lineHeight: 1.4 }}>{msg.text}</p>
      </div>

      {/* Stock alerts */}
      {stockAlerts?.length > 0 && (
        <div style={{ background: '#ef444415', border: '1px solid #ef444440', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ מלאי נמוך – כדאי לחדש</p>
          {stockAlerts.map(m => (
            <p key={m.id} style={{ fontSize: 12, color: '#fca5a5', marginTop: 2 }}>
              {m.name} – נשארו {m.stockCount} טבליות בלבד
            </p>
          ))}
        </div>
      )}

      {/* Progress */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#8b949e' }}>ההתקדמות שלך היום</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? '#22c55e' : '#58a6ff' }}>{pct}%</span>
        </div>
        <div style={{ background: '#30363d', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
            background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#58a6ff,#388bfd)'
          }} />
        </div>
        <p style={{ fontSize: 12, color: '#8b949e', marginTop: 8 }}>
          {takenDoses === 0
            ? 'עדיין לא לקחת תרופות היום'
            : `לקחת ${takenDoses} מתוך ${totalDoses} מנות`}
        </p>
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#8b949e' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💊</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>אין תרופות מוגדרות</p>
          <p style={{ fontSize: 13, marginTop: 6, color: '#6b7280' }}>עבור לטאב "הטיפול שלך" כדי להוסיף</p>
        </div>
      )}

      {/* Med groups by time */}
      {grouped.map(({ time, meds }) => (
        <div key={time} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{TIME_ICONS[time]}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: TIME_COLORS[time] }}>{time}</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>· {meds.filter(m => isTaken(m.id, time)).length}/{meds.length} נלקחו</span>
          </div>
          {meds.map(med => {
            const taken = isTaken(med.id, time)
            return (
              <div key={med.id + time} style={{
                background: taken ? '#161b22' : '#161b22',
                borderRadius: 12, padding: '13px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.25s',
                border: `1px solid ${taken ? '#238636' : '#30363d'}`,
                opacity: taken ? 0.7 : 1,
              }}>
                {med.photo
                  ? <img src={med.photo} alt={med.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #30363d' }} />
                  : <div style={{ width: 12, height: 12, borderRadius: '50%', background: med.color || '#58a6ff', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 15,
                    textDecoration: taken ? 'line-through' : 'none',
                    color: taken ? '#8b949e' : '#e6edf3'
                  }}>{med.name}</div>
                  {med.dose && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 1 }}>{med.dose}</div>}
                  {med.instructions && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>📋 {med.instructions}</div>}
                  {med.stockCount && Number(med.stockCount) <= Number(med.stockAlert || 0) && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⚠️ נשארו {med.stockCount} טבליות</div>
                  )}
                </div>
                <button onClick={() => toggleTaken(med.id, time)} style={{
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  padding: taken ? '7px 10px' : '7px 14px',
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
    </div>
  )
}
