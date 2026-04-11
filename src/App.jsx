import { useState } from 'react'
import { loadData, saveData, uid, todayKey, daysUntilExpiry } from './utils'
import TodayTab from './tabs/TodayTab'
import MedsTab from './tabs/MedsTab'
import InventoryTab from './tabs/InventoryTab'
import HistoryTab from './tabs/HistoryTab'
import MedModal from './components/MedModal'
import InventoryModal from './components/InventoryModal'
import ProfilesBar from './components/ProfilesBar'
import NotificationsButton from './components/NotificationsButton'
import PrescriptionsTab from './tabs/PrescriptionsTab'

function getGreeting(name) {
  const h = new Date().getHours()
  if (h < 6)  return `לילה טוב, ${name} 🌙`
  if (h < 12) return `בוקר טוב, ${name} ☀️`
  if (h < 17) return `צהריים טובים, ${name} 🌤`
  if (h < 21) return `ערב טוב, ${name} 🌆`
  return `לילה טוב, ${name} 🌙`
}

function getTabLabel(id, name) {
  const h = new Date().getHours()
  const timeOfDay = h < 12 ? 'הבוקר' : h < 17 ? 'הצהריים' : h < 21 ? 'הערב' : 'הלילה'
  switch (id) {
    case 'today':     return `${timeOfDay} שלך`
    case 'meds':      return `הטיפול של ${name}`
    case 'inventory': return `ארון התרופות`
    case 'prescriptions': return 'המרשמים שלי'
    case 'history':   return `איך עובר עליך?`
    default: return id
  }
}

const TAB_ICONS = { today: '🌸', meds: '💊', inventory: '🏠', prescriptions: '📋', history: '📊' }
const TAB_IDS = ['today', 'meds', 'inventory', 'prescriptions', 'history']

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState('today')
  const [modal, setModal] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const update = fn => setData(prev => { const next = fn(prev); saveData(next); return next })

  const activeProfile = data.profiles?.find(p => p.id === data.activeProfile) || data.profiles?.[0]
  const profileName = activeProfile?.name || 'אורח'
  const profileMeds = data.meds.filter(m => m.profileId === data.activeProfile)
  const profileLog = data.log.filter(l => l.profileId === data.activeProfile)

  const today = todayKey()
  const todayLog = profileLog.filter(l => l.date === today)

  const isTaken = (medId, time) => todayLog.some(l => l.medId === medId && l.time === time)
  const toggleTaken = (medId, time) => {
    update(prev => {
      const exists = prev.log.find(l => l.profileId === data.activeProfile && l.date === today && l.medId === medId && l.time === time)
      return {
        ...prev,
        log: exists
          ? prev.log.filter(l => !(l.profileId === data.activeProfile && l.date === today && l.medId === medId && l.time === time))
          : [...prev.log, { date: today, medId, time, profileId: data.activeProfile, takenAt: new Date().toTimeString().slice(0, 5) }]
      }
    })
  }

  const totalDoses = profileMeds.reduce((s, m) => s + (m.times?.length || 0), 0)
  const takenDoses = todayLog.length
  const pct = totalDoses ? Math.round((takenDoses / totalDoses) * 100) : 0

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const dayLog = profileLog.filter(l => l.date === key)
    const p = totalDoses ? Math.round((dayLog.length / totalDoses) * 100) : 0
    return { key, label: d.toLocaleDateString('he-IL', { weekday: 'short' }), pct: Math.min(p, 100) }
  })

  const stockAlerts = profileMeds.filter(m =>
    m.stockCount && m.stockAlert && Number(m.stockCount) <= Number(m.stockAlert)
  )
  const expiredOrSoon = [...profileMeds, ...data.inventory].filter(m => {
    const d = daysUntilExpiry(m.expiry)
    return d !== null && d <= 30
  })
  const prescriptionAlerts = (data.prescriptions || []).filter(p => {
    if (p.profileId !== data.activeProfile) return false
    const d = daysUntilRenewal(p.date, p.months)
    return d !== null && d <= 14
  })
  const alertCount = stockAlerts.length + expiredOrSoon.length + prescriptionAlerts.length

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#161b22 0%,#1c2128 100%)', borderBottom: '1px solid #30363d', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', letterSpacing: -0.5, lineHeight: 1.2 }}>
              {getGreeting(profileName)}
            </h1>
            <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · מטפלים בך 💙
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 2 }}>
            {alertCount > 0 && (
              <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b55', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
                ⚠️ {alertCount}
              </div>
            )}
            <NotificationsButton meds={profileMeds} profileName={profileName} />
          </div>
        </div>
        <ProfilesBar data={data} update={update} />
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'today'     && <TodayTab data={{ ...data, meds: profileMeds }} isTaken={isTaken} toggleTaken={toggleTaken} pct={pct} takenDoses={takenDoses} totalDoses={totalDoses} stockAlerts={stockAlerts} profileName={profileName} inventory={data.inventory} />}
        {tab === 'meds'      && <MedsTab data={{ ...data, meds: profileMeds }} update={update} activeProfile={data.activeProfile} setModal={setModal} setEditTarget={setEditTarget} profileName={profileName} />}
        {tab === 'inventory' && <InventoryTab data={data} update={update} setModal={setModal} setEditTarget={setEditTarget} />}
        {tab === 'history'   && <HistoryTab last7={last7} pct={pct} data={{ ...data, meds: profileMeds }} totalDoses={totalDoses} profileName={profileName} />}
        {tab === 'prescriptions' && <PrescriptionsTab data={data} update={update} profileName={profileName} />}
      </div>

      {/* Bottom Nav – personal */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '1px solid #30363d', display: 'flex' }}>
        {TAB_IDS.map(id => {
          const active = tab === id
          const label = getTabLabel(id, profileName)
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 4px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, transition: 'all 0.2s',
              borderTop: active ? '2px solid #58a6ff' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 20 }}>{TAB_ICONS[id]}</span>
              <span style={{
                fontSize: 10, fontFamily: 'Heebo', fontWeight: active ? 700 : 400,
                color: active ? '#58a6ff' : '#8b949e',
                textAlign: 'center', lineHeight: 1.2,
                maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Modals */}
      {modal === 'addMed' && (
        <MedModal onClose={() => setModal(null)} onSave={med => {
          update(p => ({ ...p, meds: [...p.meds, { ...med, id: uid(), profileId: data.activeProfile }] }))
          setModal(null)
        }} />
      )}
      {modal === 'editMed' && editTarget && (
        <MedModal initial={editTarget} onClose={() => { setModal(null); setEditTarget(null) }}
          onSave={med => {
            update(p => ({ ...p, meds: p.meds.map(m => m.id === editTarget.id ? { ...med, id: editTarget.id, profileId: editTarget.profileId } : m) }))
            setModal(null); setEditTarget(null)
          }} />
      )}
      {modal === 'addInventory' && (
        <InventoryModal onClose={() => setModal(null)} onSave={item => {
          update(p => ({ ...p, inventory: [...p.inventory, { ...item, id: uid() }] }))
          setModal(null)
        }} />
      )}
      {modal === 'editInventory' && editTarget && (
        <InventoryModal initial={editTarget} onClose={() => { setModal(null); setEditTarget(null) }}
          onSave={item => {
            update(p => ({ ...p, inventory: p.inventory.map(i => i.id === editTarget.id ? { ...item, id: editTarget.id } : i) }))
            setModal(null); setEditTarget(null)
          }} />
      )}
    </div>
  )
}
