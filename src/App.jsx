import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import * as db from './db'
import { ageLabel, genderColor, genderColorLight } from './utils'
import { generateVaccinations } from './data/vaccineSchedule'

import AuthScreen from './components/AuthScreen'
import FamilySetup from './components/FamilySetup'
import BabySwitcher, { BabyAvatar } from './components/BabySwitcher'
import HamburgerMenu from './components/HamburgerMenu'
import NotificationsButton from './components/NotificationsButton'

import DashboardTab from './tabs/DashboardTab'
import FeedingTab from './tabs/FeedingTab'
import DiapersTab from './tabs/DiapersTab'
import HealthTab from './tabs/HealthTab'
import VaccinationsTab from './tabs/VaccinationsTab'
import GrowthTab from './tabs/GrowthTab'
import InstallPwaPrompt from './components/InstallPwaPrompt'

const TAB_IDS = ['home', 'feeding', 'diapers', 'health', 'growth']
const TAB_META = {
  home:    { label: 'בית',      icon: '🏠' },
  feeding: { label: 'האכלה',    icon: '🍼' },
  diapers: { label: 'חיתולים',  icon: '🌸' },
  health:  { label: 'בריאות',   icon: '💊' },
  growth:  { label: 'התפתחות',  icon: '📊' },
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [family, setFamily] = useState(null)        // { id, name }
  const [familyLoading, setFamilyLoading] = useState(false)
  const [babies, setBabies] = useState([])
  const [activeBabyId, setActiveBabyId] = useState(null)
  const [data, setData] = useState({               // per-baby cached data
    babyLog: [], meds: [], medLog: [], prescriptions: [],
    inventory: [], vaccinations: [], growthLog: [], milestones: []
  })
  const [dataLoading, setDataLoading] = useState(false)
  const [tab, setTab] = useState('home')
  const [growthView, setGrowthView] = useState('milestones')
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [memberProfile, setMemberProfile] = useState(null) // { full_name, email }
  const [notifPrefs, setNotifPrefs] = useState({
    feeding: true, meds: true, vaccines: true, temp: true, fever_med: true
  })

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load notification prefs when user changes ────────────────────────────
  const notifPrefsFetched = useRef(false)
  useEffect(() => {
    // Reset the fetch guard when switching users (or signing out),
    // otherwise prefs won't reload for the next user in the same session.
    notifPrefsFetched.current = false
  }, [user?.id])

  useEffect(() => {
    if (!user || notifPrefsFetched.current) return
    notifPrefsFetched.current = true
    db.getUserSetting(user.id, 'notif_prefs').then(({ data: saved }) => {
      if (saved && typeof saved === 'object') setNotifPrefs(saved)
    })
  }, [user])

  const handleSaveNotifPrefs = async (prefs) => {
    setNotifPrefs(prefs)
    await db.setUserSetting(user.id, 'notif_prefs', prefs)
  }

  // ── Load member profile when user changes ───────────────────────────────
  useEffect(() => {
    if (!user) { setMemberProfile(null); return }
    db.getMember(user.id).then(({ data }) => {
      if (data) setMemberProfile(data)
    })
  }, [user?.id])

  // ── Load family when user changes ────────────────────────────────────────
  useEffect(() => {
    if (!user) { setFamily(null); setBabies([]); return }
    loadFamily()
  }, [user])

  const loadFamily = async () => {
    setFamilyLoading(true)
    const { data: fm } = await db.getUserFamily(user.id)
    if (fm?.families) {
      setFamily(fm.families)
      await loadBabies(fm.families.id)
    }
    setFamilyLoading(false)
  }

  const loadBabies = async (familyId) => {
    const { data: bList } = await db.getBabies(familyId)
    if (bList) {
      setBabies(bList)
      const saved = localStorage.getItem('babycare_active')
      const active = bList.find(b => b.id === saved) || bList[0]
      if (active) setActiveBabyId(active.id)
    }
  }

  // ── Load baby data when active baby or family changes ────────────────────
  useEffect(() => {
    if (!family || !activeBabyId) return
    loadBabyData()
  }, [family, activeBabyId])

  const loadBabyData = useCallback(async () => {
    if (!family || !activeBabyId) return
    setDataLoading(true)
    const fid = family.id
    const bid = activeBabyId

    const [log, meds, medLog, rx, inv, vax, growth, miles] = await Promise.all([
      db.getBabyLog(fid, bid),
      db.getMeds(fid, bid),
      db.getMedLog(fid, bid),
      db.getPrescriptions(fid, bid),
      db.getInventory(fid),
      db.getVaccinations(fid, bid),
      db.getGrowthLog(fid, bid),
      db.getMilestones(fid, bid),
    ])

    setData({
      babyLog:       log.data       || [],
      meds:          meds.data      || [],
      medLog:        medLog.data    || [],
      prescriptions: rx.data        || [],
      inventory:     inv.data       || [],
      vaccinations:  vax.data       || [],
      growthLog:     growth.data    || [],
      milestones:    miles.data     || [],
    })
    setDataLoading(false)
  }, [family, activeBabyId])

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!family) return
    const channel = supabase
      .channel(`family-${family.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baby_log', filter: `family_id=eq.${family.id}` }, () => loadBabyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meds', filter: `family_id=eq.${family.id}` }, () => loadBabyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'med_log', filter: `family_id=eq.${family.id}` }, () => loadBabyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaccinations', filter: `family_id=eq.${family.id}` }, () => loadBabyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'babies', filter: `family_id=eq.${family.id}` }, () => loadBabies(family.id))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [family, loadBabyData])

  // ── Realtime: members profile updates ───────────────────────────────────
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`member-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${user.id}` },
        (payload) => setMemberProfile(payload.new))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const activeBaby = babies.find(b => b.id === activeBabyId) || null
  const babyName   = activeBaby?.name || 'התינוק'

  const switchBaby = (id) => {
    setActiveBabyId(id)
    localStorage.setItem('babycare_active', id)
  }

  const handleFamilyCreated = async (newFamily) => {
    setFamily(newFamily)
    await loadBabies(newFamily.id)
  }

  const handleBabyAdded = async (baby) => {
    // Auto-generate vaccinations
    if (baby.birth_date) {
      const vaxList = generateVaccinations(baby.id, baby.birth_date)
      const mapped = vaxList.map(v => ({
        vaccine_id: v.vaccineId,
        name: v.name,
        vaccine_group: v.group,
        age_label: v.ageLabel,
        scheduled_date: v.scheduledDate,
        status: v.status,
      }))
      await db.addVaccinations(family.id, baby.id, mapped)
    }
    await loadBabies(family.id)
    switchBaby(baby.id)
  }

  const handleSignOut = async () => {
    await db.signOut()
    setUser(null)
    setFamily(null)
    setBabies([])
    setData({ babyLog: [], meds: [], medLog: [], prescriptions: [], inventory: [], vaccinations: [], growthLog: [], milestones: [] })
  }

  const handleDeleteAccount = async () => {
    if (!family || !user) return
    await db.deleteAllFamilyData(family.id, user.id)
    // signOut is called inside deleteAllFamilyData — auth listener clears user
    setFamily(null)
    setBabies([])
    setData({ babyLog: [], meds: [], medLog: [], prescriptions: [], inventory: [], vaccinations: [], growthLog: [], milestones: [] })
    localStorage.removeItem('babycare_active')
  }

  // ── Theme color based on baby gender ────────────────────────────────────
  const themeColor      = genderColor(activeBaby?.gender)
  const themeColorLight = genderColorLight(activeBaby?.gender)

  // ── Common props for tabs ────────────────────────────────────────────────
  const commonProps = {
    data,
    reload: loadBabyData,
    family,
    activeBaby,
    babyName,
    user,
    themeColor,
  }

  // ── Render states ────────────────────────────────────────────────────────
  if (authLoading) return <Splash />

  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />

  if (familyLoading) return <Splash text="טוען נתוני משפחה..." />

  if (!family) return (
    <FamilySetup
      user={user}
      onFamilyCreated={handleFamilyCreated}
      onSignOut={handleSignOut}
    />
  )

  if (!activeBaby) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Heebo', direction: 'rtl', padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>👶</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#f9a8d4', marginBottom: 8 }}>ברוכים הבאים!</div>
      <div style={{ fontSize: 14, color: '#8b949e', marginBottom: 32, textAlign: 'center' }}>הוסף את התינוק הראשון שלך</div>
      <button onClick={() => setShowSwitcher(true)} style={{
        background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 14,
        padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo'
      }}>+ הוסף תינוק</button>
      {showSwitcher && (
        <BabySwitcher
          babies={babies} activeBabyId={activeBabyId}
          family={family} user={user}
          onSwitch={switchBaby}
          onBabyAdded={handleBabyAdded}
          onClose={() => setShowSwitcher(false)}
          themeColor='#a78bfa'
          forceAdd
        />
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', paddingBottom: 72, fontFamily: 'Heebo', direction: 'rtl' }}>
      <InstallPwaPrompt />

      {/* ── HEADER ── */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #30363d', padding: '10px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setShowSwitcher(true)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}>
            <BabyAvatar baby={activeBaby} size={40} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: themeColorLight }}>{babyName}</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>{ageLabel(activeBaby.birth_date)}</div>
            </div>
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <NotificationsButton
              user={user}
              activeBaby={activeBaby}
              babyLog={data.babyLog}
              meds={data.meds}
              vaccinations={data.vaccinations}
              notifPrefs={notifPrefs}
              onSavePrefs={handleSaveNotifPrefs}
            />
            <button onClick={() => setShowSwitcher(true)} title="הוסף / נהל תינוקות" style={{
              background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e'
            }}>+</button>
            <button onClick={() => setShowMenu(true)} style={{
              background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>☰</button>
          </div>
        </div>
      </div>

      {/* ── BABY CHIPS (below header, only when 2+ babies) ── */}
      {babies.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px',
          borderBottom: '1px solid #30363d', background: '#0d1117',
          scrollbarWidth: 'none'
        }}>
          {babies.map(b => {
            const isActive = b.id === activeBabyId
            const color = genderColor(b.gender)
            return (
              <button
                key={b.id}
                onClick={() => switchBaby(b.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isActive ? color + '22' : '#161b22',
                  border: `1px solid ${isActive ? color : '#30363d'}`,
                  borderRadius: 20, padding: '5px 12px 5px 8px',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  fontFamily: 'Heebo'
                }}
              >
                <BabyAvatar baby={b} size={22} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? color : '#8b949e' }}>
                  {b.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ padding: 16 }}>
        {dataLoading && (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', fontSize: 13 }}>טוען נתונים...</div>
        )}
        {!dataLoading && (
          <>
            {tab === 'home'          && <DashboardTab     {...commonProps} onNavigate={setTab} />}
            {tab === 'feeding'       && <FeedingTab        {...commonProps} />}
            {tab === 'diapers'       && <DiapersTab        {...commonProps} />}
            {tab === 'health'        && <HealthTab         {...commonProps} />}
            {tab === 'vaccinations'  && <VaccinationsTab   {...commonProps} />}
            {tab === 'growth'        && <GrowthTab         {...commonProps} growthView={growthView} setGrowthView={setGrowthView} />}
          </>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '1px solid #30363d', display: 'flex', zIndex: 50 }}>
        {TAB_IDS.map(id => {
          const active = tab === id
          const meta = TAB_META[id]
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 2px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              borderTop: active ? `2px solid ${themeColor}` : '2px solid transparent',
            }}>
              <span style={{ fontSize: 16 }}>{meta.icon}</span>
              <span style={{
                fontSize: 8, fontFamily: 'Heebo', fontWeight: active ? 700 : 400,
                color: active ? themeColor : '#8b949e',
                textAlign: 'center', lineHeight: 1.2
              }}>{meta.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── BABY SWITCHER ── */}
      {showSwitcher && (
        <BabySwitcher
          babies={babies} activeBabyId={activeBabyId}
          family={family} user={user}
          onSwitch={switchBaby}
          onBabyAdded={handleBabyAdded}
          onClose={async () => { setShowSwitcher(false); await loadBabies(family.id) }}
          themeColor={themeColor}
        />
      )}

      {/* ── HAMBURGER MENU ── */}
      {showMenu && (
        <HamburgerMenu
          user={user} family={family} babies={babies}
          memberProfile={memberProfile}
          onProfileUpdated={() => db.getMember(user.id).then(({ data }) => { if (data) setMemberProfile(data) })}
          onClose={() => setShowMenu(false)}
          onSignOut={handleSignOut}
          onManageBabies={() => { setShowMenu(false); setShowSwitcher(true) }}
          onOpenVaccinations={() => { setShowMenu(false); setTab('vaccinations') }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  )
}

function Splash({ text = 'BabyCare...' }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Heebo' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>👶</div>
      <div style={{ fontSize: 14, color: '#6b7280' }}>{text}</div>
    </div>
  )
}
