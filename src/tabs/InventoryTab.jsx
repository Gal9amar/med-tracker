import { daysUntilExpiry, expiryColor, expiryLabel } from '../utils'

export default function InventoryTab({ data, update, setModal, setEditTarget }) {
  const deleteItem = id => {
    if (confirm('למחוק?')) update(p => ({ ...p, inventory: p.inventory.filter(i => i.id !== id) }))
  }

  const sorted = [...data.inventory].sort((a, b) => {
    const da = daysUntilExpiry(a.expiry) ?? 9999
    const db = daysUntilExpiry(b.expiry) ?? 9999
    return da - db
  })

  return (
    <div>
      <button onClick={() => setModal('addInventory')} style={{
        background: '#388bfd', color: '#fff', border: 'none', borderRadius: 8,
        padding: '10px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'Heebo',
        cursor: 'pointer', width: '100%', marginBottom: 16
      }}>
        + הוסף לתרופות הבית
      </button>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#8b949e' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏠</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>מלאי הבית ריק</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>הוסף תרופות שיש לך בבית</p>
        </div>
      )}

      {sorted.map(item => {
        const days = daysUntilExpiry(item.expiry)
        const ec = expiryColor(days)
        const isAlert = days !== null && days <= 30
        return (
          <div key={item.id} style={{
            background: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10,
            border: `1px solid ${isAlert ? ec + '44' : '#30363d'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{item.name}</span>
                  {isAlert && (
                    <span style={{ fontSize: 10, background: `${ec}22`, color: ec, borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>
                      {expiryLabel(days)}
                    </span>
                  )}
                </div>
                {item.quantity && <div style={{ fontSize: 13, color: '#8b949e', marginTop: 2 }}>כמות: {item.quantity}</div>}
                {item.location && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>📍 {item.location}</div>}
                {item.instructions && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>📋 {item.instructions}</div>}
                {item.notes && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>📝 {item.notes}</div>}
                {item.expiry && (
                  <div style={{ fontSize: 12, marginTop: 6, color: ec, fontWeight: isAlert ? 700 : 400 }}>
                    🗓 תוקף: {item.expiry}{days !== null ? ` · ${expiryLabel(days)}` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setEditTarget(item); setModal('editInventory') }} style={iconBtn()}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={iconBtn()}>🗑️</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const iconBtn = () => ({
  background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
  width: 34, height: 34, cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
})
