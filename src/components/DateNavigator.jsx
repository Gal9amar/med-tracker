// Shared date navigator – prev/next day + date display
import { useState } from 'react'
import { todayKey } from '../utils'

export function useDateNav() {
  const [offset, setOffset] = useState(0) // 0 = today, -1 = yesterday, etc.

  const getKey = () => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
  }

  const getLabel = () => {
    if (offset === 0) return 'היום'
    if (offset === -1) return 'אתמול'
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return {
    offset,
    dateKey: getKey(),
    dateLabel: getLabel(),
    isToday: offset === 0,
    goBack: () => setOffset(o => o - 1),
    goForward: () => setOffset(o => Math.min(0, o + 1)),
  }
}

export default function DateNavigator({ dateLabel, isToday, onBack, onForward, color = '#58a6ff' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      direction: 'ltr',
      background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
      padding: '10px 14px', marginBottom: 16
    }}>
      {/* שמאל = קדימה (היום) */}
      <button onClick={onForward} disabled={isToday} style={{
        ...navBtn(),
        opacity: isToday ? 0.3 : 1,
        cursor: isToday ? 'default' : 'pointer'
      }}>
        ‹
      </button>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? color : '#e6edf3' }}>
          {isToday ? '📅 היום' : `📅 ${dateLabel}`}
        </div>
        {isToday && (
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* ימין = אתמול */}
      <button onClick={onBack} style={navBtn()}>
        ›
      </button>
    </div>
  )
}

const navBtn = () => ({
  background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
  width: 36, height: 36, cursor: 'pointer', fontSize: 22, fontWeight: 300,
  color: '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1
})
