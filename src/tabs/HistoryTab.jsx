export default function HistoryTab({ last7, pct, data, totalDoses }) {
  const maxPct = Math.max(...last7.map(d => d.pct), 1)
  const avg = last7.length ? Math.round(last7.reduce((s, d) => s + d.pct, 0) / last7.length) : 0

  return (
    <div>
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          {[
            { value: `${pct}%`, label: 'היום', color: '#58a6ff' },
            { value: `${avg}%`, label: 'ממוצע שבועי', color: '#22c55e' },
            { value: data.meds.length, label: 'תרופות פעילות', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
          {last7.map(d => {
            const barColor = d.pct >= 80
              ? 'linear-gradient(180deg,#22c55e,#16a34a)'
              : d.pct >= 50
                ? 'linear-gradient(180deg,#f59e0b,#d97706)'
                : 'linear-gradient(180deg,#ef4444,#dc2626)'
            const textColor = d.pct >= 80 ? '#22c55e' : d.pct >= 50 ? '#f59e0b' : '#ef4444'
            return (
              <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: textColor, fontWeight: 700 }}>{d.pct}%</span>
                <div style={{ width: '100%', background: '#21262d', borderRadius: 4, height: 70, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${(d.pct / maxPct) * 100}%`, background: barColor, borderRadius: 4, transition: 'height 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 10, color: '#8b949e' }}>{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Compliance message */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📈 הערכת ציות</h3>
        {avg >= 90 && <p style={{ fontSize: 13, color: '#22c55e', lineHeight: 1.6 }}>🌟 <strong>מעולה!</strong> אתה לוקח תרופות בצורה מאוד עקבית. המשך כך!</p>}
        {avg >= 70 && avg < 90 && <p style={{ fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>👍 <strong>טוב!</strong> יש מקום לשיפור קל בעקביות. נסה להגדיר תזכורות.</p>}
        {avg < 70 && avg > 0 && <p style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.6 }}>⚠️ <strong>כדאי לשפר</strong> – ציות נמוך עלול להשפיע על הטיפול. שוחח עם הרופא שלך.</p>}
        {avg === 0 && <p style={{ fontSize: 13, color: '#8b949e' }}>עדיין אין נתונים מספיקים. התחל לסמן תרופות שנלקחו.</p>}
      </div>
    </div>
  )
}
