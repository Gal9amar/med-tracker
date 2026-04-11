import { TIMES, TIME_ICONS, TIME_COLORS } from '../utils'

export default function TodayTab({ data, isTaken, toggleTaken, pct, takenDoses, totalDoses }) {
  const groupedByTime = TIMES.map(time => ({
    time,
    meds: data.meds.filter(m => m.times?.includes(time))
  })).filter(g => g.meds.length > 0)

  return (
    <div>
      {/* Progress Card */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: '#8b949e' }}>התקדמות יומית</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? '#22c55e' : '#58a6ff' }}>{pct}%</span>
        </div>
        <div style={{ background: '#30363d', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
            background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#58a6ff,#388bfd)'
          }} />
        </div>
        <p style={{ fontSize: 12, color: '#8b949e', marginTop: 8 }}>{takenDoses} מתוך {totalDoses} מנות נלקחו</p>
        {pct === 100 && <p style={{ fontSize: 13, color: '#22c55e', marginTop: 6, fontWeight: 600 }}>🎉 כל התרופות נלקחו היום!</p>}
      </div>

      {groupedByTime.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#8b949e' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💊</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>אין תרופות מוגדרות</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>עבור לטאב "תרופות" להוספה</p>
        </div>
      )}

      {groupedByTime.map(({ time, meds }) => (
        <div key={time} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{TIME_ICONS[time]}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: TIME_COLORS[time] }}>{time}</span>
          </div>
          {meds.map(med => {
            const taken = isTaken(med.id, time)
            return (
              <div key={med.id + time} style={{
                background: '#161b22', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                border: `1px solid ${taken ? '#238636' : '#30363d'}`,
                opacity: taken ? 0.72 : 1,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.color || '#58a6ff', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, textDecoration: taken ? 'line-through' : 'none', color: taken ? '#8b949e' : '#e6edf3' }}>{med.name}</div>
                  {med.dose && <div style={{ fontSize: 12, color: '#8b949e' }}>{med.dose}</div>}
                  {med.instructions && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>📋 {med.instructions}</div>}
                </div>
                <button onClick={() => toggleTaken(med.id, time)} style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: taken ? '#238636' : '#21262d', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0
                }}>
                  {taken ? '✅' : '⭕'}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
