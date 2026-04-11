import { useState } from 'react'
import { loadData, saveData, uid, todayKey, daysUntilExpiry } from './utils'
import TodayTab from './tabs/TodayTab'
import MedsTab from './tabs/MedsTab'
import InventoryTab from './tabs/InventoryTab'
import HistoryTab from './tabs/HistoryTab'
import MedModal from './components/MedModal'
import InventoryModal from './components/InventoryModal'

const TABS = [
  { id: 'today', icon: '📅', label: 'היום' },
  { id: 'meds', icon: '💊', label: 'תרופות' },
  { id: 'inventory', icon: '🏠', label: 'מלאי הבית' },
  { id: 'history', icon: '📊', label: 'היסטוריה' },
]

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState('today')
  const [modal, setModal] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const update = fn => setData(prev => { const next = fn(prev); saveData(next); return next })

  const today = todayKey()
  const todayLog = data.log.filter(l => l.date === today)
  const isTaken = (medId, time) => todayLog.some(l => l.medId === medId && l.time === time)
  const toggleTaken = (medId, time) => {
    update(prev => {
      const exists = prev.log.find(l => l.date === today && l.medId === medId && l.time === time)
      return {
        ...prev,
        log: exists
          ? prev.log.filter(l => !(l.date === today && l.medId === medId && l.time === time))
          : [...prev.log, { date: today, medId, time, takenAt: new Date().toTimeString().slice(0, 5) }]
      }
    })
  }

  const totalDoses = data.meds.reduce((s, m) => s + (m.times?.length || 0), 0)
  const takenDoses = todayLog.length
  const pct = totalDoses ? Math.round((takenDoses / totalDoses) * 100) : 0

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const dayLog = data.log.filter(l => l.date === key)
    const p = totalDoses ? Math.round((dayLog.length / totalDoses) * 100) : 0
    return { key, label: d.toLocaleDateString('he-IL', { weekday: 'short' }), pct: Math.min(p, 100) }
  })

  const expiredOrSoon = [...data.meds, ...data.inventory].filter(m => {
    const d = daysUntilExpiry(m.expiry)
    return d !== null && d <= 30
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', paddingBottom: 72 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#161b22 0%,#1c2128 100%)', borderBottom: '1px solid #30363d', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', letterSpacing: -0.5 }}>💊 MedTracker</h1>
            <p style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {expiredOrSoon.length > 0 && (
            <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#f59e0b' }}>
              ⚠️ {expiredOrSoon.length} בתוקף קצר
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: 16 }}>
        {tab === 'today' && <TodayTab data={data} isTaken={isTaken} toggleTaken={toggleTaken} pct={pct} takenDoses={takenDoses} totalDoses={totalDoses} />}
        {tab === 'meds' && <MedsTab data={data} update={update} setModal={setModal} setEditTarget={setEditTarget} />}
        {tab === 'inventory' && <InventoryTab data={data} update={update} setModal={setModal} setEditTarget={setEditTarget} />}
        {tab === 'history' && <HistoryTab last7={last7} pct={pct} data={data} totalDoses={totalDoses} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '1px solid #30363d', display: 'flex', padding: '6px 0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: tab === t.id ? '#58a6ff' : '#8b949e', transition: 'color 0.2s'
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontFamily: 'Heebo', fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {modal === 'addMed' && (
        <MedModal onClose={() => setModal(null)} onSave={med => { update(p => ({ ...p, meds: [...p.meds, { ...med, id: uid() }] })); setModal(null) }} />
      )}
      {modal === 'editMed' && editTarget && (
        <MedModal initial={editTarget} onClose={() => { setModal(null); setEditTarget(null) }}
          onSave={med => { update(p => ({ ...p, meds: p.meds.map(m => m.id === editTarget.id ? { ...med, id: editTarget.id } : m) })); setModal(null); setEditTarget(null) }} />
      )}
      {modal === 'addInventory' && (
        <InventoryModal onClose={() => setModal(null)} onSave={item => { update(p => ({ ...p, inventory: [...p.inventory, { ...item, id: uid() }] })); setModal(null) }} />
      )}
      {modal === 'editInventory' && editTarget && (
        <InventoryModal initial={editTarget} onClose={() => { setModal(null); setEditTarget(null) }}
          onSave={item => { update(p => ({ ...p, inventory: p.inventory.map(i => i.id === editTarget.id ? { ...item, id: editTarget.id } : i) })); setModal(null); setEditTarget(null) }} />
      )}
    </div>
  )
}
