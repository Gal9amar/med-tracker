import { useRef, useState } from 'react'
import { TIME_ICONS, TIME_COLORS, daysUntilExpiry, expiryColor, expiryLabel } from '../utils'

export default function MedsTab({ data, update, setModal, setEditTarget }) {
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const deleteMed = id => {
    if (confirm('למחוק תרופה זו?'))
      update(p => ({ ...p, meds: p.meds.filter(m => m.id !== id) }))
  }

  const startScan = async () => {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] })
        const interval = setInterval(async () => {
          if (!videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) { clearInterval(interval); stopScan(); alert(`ברקוד: ${barcodes[0].rawValue}`) }
          } catch { }
        }, 500)
      }
    } catch { alert('לא ניתן לגשת למצלמה'); setScanning(false) }
  }

  const stopScan = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setScanning(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setModal('addMed')} style={btn('#388bfd')}>+ הוסף תרופה</button>
        <button onClick={scanning ? stopScan : startScan} style={btn(scanning ? '#ef4444' : '#21262d', scanning ? '#fff' : '#e6edf3', '1px solid #30363d')}>
          {scanning ? '⏹ עצור' : '📷 סרוק'}
        </button>
      </div>

      {scanning && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '2px solid #f59e0b', position: 'relative' }}>
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '2px solid #f59e0b', width: 200, height: 80, borderRadius: 8 }} />
          <p style={{ textAlign: 'center', padding: 8, background: '#0d1117', fontSize: 12, color: '#f59e0b' }}>כוון את הברקוד לתוך המסגרת</p>
        </div>
      )}

      {data.meds.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#8b949e' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💊</div>
          <p>אין תרופות עדיין</p>
        </div>
      )}

      {data.meds.map(med => {
        const days = daysUntilExpiry(med.expiry)
        return (
          <div key={med.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: med.color || '#58a6ff', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{med.name}</div>
                {med.dose && <div style={{ fontSize: 13, color: '#8b949e' }}>{med.dose}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {med.times?.map(t => (
                    <span key={t} style={{ background: `${TIME_COLORS[t]}22`, color: TIME_COLORS[t], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      {TIME_ICONS[t]} {t}
                    </span>
                  ))}
                </div>
                {med.instructions && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>📋 {med.instructions}</div>}
                {med.notes && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>📝 {med.notes}</div>}
                {days !== null && (
                  <div style={{ fontSize: 12, marginTop: 6, color: expiryColor(days), fontWeight: days <= 30 ? 700 : 400 }}>
                    🗓 תוקף: {med.expiry} · {expiryLabel(days)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setEditTarget(med); setModal('editMed') }} style={iconBtn()}>✏️</button>
                <button onClick={() => deleteMed(med.id)} style={iconBtn()}>🗑️</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const btn = (bg, color = '#fff', border = 'none') => ({
  background: bg, color, border, borderRadius: 8, padding: '10px 14px',
  fontSize: 13, fontWeight: 600, fontFamily: 'Heebo', cursor: 'pointer', flex: 1
})
const iconBtn = () => ({
  background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
  width: 34, height: 34, cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
})
