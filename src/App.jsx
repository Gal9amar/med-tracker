import { useState } from 'react'
import { loadData, saveData, uid, todayKey, daysUntilExpiry, daysUntilRenewal } from './utils'
import AgeHomeTab from './tabs/AgeHomeTab'
import MedsTab from './tabs/MedsTab'
import InventoryTab from './tabs/InventoryTab'
import HistoryTab from './tabs/HistoryTab'
import PrescriptionsTab from './tabs/PrescriptionsTab'
import RecommendationsTab from './tabs/RecommendationsTab'
import MedModal from './components/MedModal'
import InventoryModal from './components/InventoryModal'
import ProfilesBar, { FamilyPanel } from './components/ProfilesBar'
import NotificationsButton from './components/NotificationsButton'
import { AGE_CATEGORIES, getCategoryFromBirthDate } from './ageProfiles'

function getGreeting(name, ageCategory) {
  const h = new Date().getHours()
  if (ageCategory === 'baby' || ageCategory === 'toddler') {
    if (h < 6)  return `לילה טוב, ${name} 🌙`
    if (h < 12) return `בוקר טוב, ${name} 👶`
    if (h < 17) return `צהריים טובים, ${name} 🍼`
    return `ערב טוב, ${name} 🌙`
  }
  if (h < 6)  return `לילה טוב, ${name} 🌙`
  if (h < 12) return `בוקר טוב, ${name} ☀️`
  if (h < 17) return `צהריים טובים, ${name} 🌤`
  if (h < 21) return `ערב טוב, ${name} 🌆`
  return `לילה טוב, ${name} 🌙`
}

function getTabLabel(id, name, ageCategory) {
  const h = new Date().getHours()
  const t = h < 12 ? 'הבוקר' : h < 17 ? 'הצהריים' : h < 21 ? 'הערב' : 'הלילה'
  const isBaby = ageCategory === 'baby' || ageCategory === 'toddler'
  switch (id) {
    case 'today':         return isBaby ? `מעקב ${name}` : `${t} שלך`
    case 'meds':          return `הטיפול של ${name}`
    case 'inventory':     return `ארון התרופות`
    case 'prescriptions': return `המרשמים`
    case 'history':       return `איך עובר עליך?`
    case 'recommendations': return `המלצות`
    default: return id
  }
}

const TAB_ICONS = { today: '🌸', meds: '💊', inventory: '🏠', prescriptions: '📋', history: '📊', recommendations: '💡' }
const TAB_IDS = ['today', 'meds', 'inventory', 'prescriptions', 'history', 'recommendations']

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState('today')
  const [modal, setModal] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [showFamily, setShowFamily] = useState(false)
  const [showAddProfile, setShowAddProfile] = useState(false)
  const [editProfileTarget, setEditProfileTarget] = useState(null)

  const update = fn => setData(prev => { const next = fn(prev); saveData(next); return next })

  const activeProfile = data.profiles?.find(p => p.id === data.activeProfile) || data.profiles?.[0]
  const profileName = activeProfile?.name || 'אורח'
  const ageCategory = getCategoryFromBirthDate(activeProfile?.birthDate) || activeProfile?.ageCategory || 'adult'
  const ageCat = AGE_CATEGORIES.find(c => c.id === ageCategory) || AGE_CATEGORIES[4]

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

  const stockAlerts = profileMeds.filter(m => m.stockCount && m.stockAlert && Number(m.stockCount) <= Number(m.stockAlert))
  const expiredOrSoon = [...profileMeds, ...data.inventory].filter(m => { const d = daysUntilExpiry(m.expiry); return d !== null && d <= 30 })
  const prescriptionAlerts = (data.prescriptions || []).filter(p => {
    if (p.profileId !== data.activeProfile) return false
    const d = daysUntilRenewal(p.date, p.months)
    return d !== null && d <= 14
  })
  const alertCount = stockAlerts.length + expiredOrSoon.length + prescriptionAlerts.length

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', paddingBottom: 80 }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #30363d', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{activeProfile?.avatar || '👤'}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getGreeting(profileName, ageCategory)}
              </div>
              <span style={{ fontSize: 10, background: ageCat.color + '22', color: ageCat.color, borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
                {ageCat.icon} {ageCat.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginRight: 8 }}>
            {alertCount > 0 && (
              <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 8, padding: '5px 7px', fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
                ⚠️ {alertCount}
              </div>
            )}
            <NotificationsButton meds={profileMeds} profileName={profileName} />
            <button onClick={() => setShowFamily(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
              borderRadius: 8, border: '1px solid #30363d', background: '#21262d', cursor: 'pointer'
            }}>
              <span style={{ fontSize: 15 }}>👨‍👩‍👧</span>
              <span style={{ fontSize: 12, color: '#c9d1d9', fontFamily: 'Heebo', fontWeight: 700 }}>{data.profiles.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: 16 }}>
        {tab === 'today' && (
          <AgeHomeTab
            data={{ ...data, meds: profileMeds }}
            update={update}
            profile={activeProfile}
            profileName={profileName}
            activeProfileId={data.activeProfile}
            isTaken={isTaken}
            toggleTaken={toggleTaken}
            pct={pct} takenDoses={takenDoses} totalDoses={totalDoses}
            stockAlerts={stockAlerts}
            inventory={data.inventory}
            babyLog={data.babyLog || []}
          />
        )}
        {tab === 'meds'          && <MedsTab data={{ ...data, meds: profileMeds }} update={update} activeProfile={data.activeProfile} setModal={setModal} setEditTarget={setEditTarget} profileName={profileName} />}
        {tab === 'inventory'     && <InventoryTab data={data} update={update} setModal={setModal} setEditTarget={setEditTarget} />}
        {tab === 'prescriptions' && <PrescriptionsTab data={data} update={update} profileName={profileName} />}
        {tab === 'history'       && <HistoryTab last7={last7} pct={pct} data={{ ...data, meds: profileMeds }} totalDoses={totalDoses} profileName={profileName} />}
        {tab === 'recommendations' && <RecommendationsTab profile={activeProfile} profileName={profileName} ageCategory={ageCategory} />}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '1px solid #30363d', display: 'flex' }}>
        {TAB_IDS.map(id => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 2px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, transition: 'all 0.2s',
              borderTop: active ? `2px solid ${ageCat.color}` : '2px solid transparent',
            }}>
              <span style={{ fontSize: 19 }}>{TAB_ICONS[id]}</span>
              <span style={{
                fontSize: 9, fontFamily: 'Heebo', fontWeight: active ? 700 : 400,
                color: active ? ageCat.color : '#8b949e',
                textAlign: 'center', lineHeight: 1.2,
                maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{getTabLabel(id, profileName, ageCategory)}</span>
            </button>
          )
        })}
      </div>

      {/* ── FAMILY PANEL ── */}
      {showFamily && (
        <FamilyPanel
          data={data}
          update={update}
          onClose={() => setShowFamily(false)}
          onOpenAddProfile={(p) => {
            setEditProfileTarget(p)
            setShowAddProfile(true)
            setShowFamily(false)
          }}
        />
      )}

      {/* ── ADD/EDIT PROFILE ── */}
      {showAddProfile && (
        <ProfilesBar
          data={data}
          update={update}
          editTarget={editProfileTarget}
          onClose={() => { setShowAddProfile(false); setEditProfileTarget(null) }}
          forceOpen
        />
      )}

      {/* ── MED MODALS ── */}
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
