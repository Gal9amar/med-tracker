// Home screen that adapts per age category
import TodayTab from './TodayTab'
import BabyTab from './BabyTab'
import { AGE_TIPS } from '../ageProfiles'

function AgeTips({ ageCategory, name }) {
  const tips = AGE_TIPS[ageCategory] || []
  if (!tips.length) return null
  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 14, marginTop: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', marginBottom: 10 }}>💡 המלצות לגיל {name}</p>
      {tips.map((tip, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>•</span>
          <p style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.5 }}>{tip}</p>
        </div>
      ))}
    </div>
  )
}

export default function AgeHomeTab({ data, update, profile, profileName, activeProfileId, isTaken, toggleTaken, pct, takenDoses, totalDoses, stockAlerts, inventory, babyLog }) {
  const ageCategory = profile?.ageCategory || 'adult'

  // Baby gets completely different UI
  if (ageCategory === 'baby' || ageCategory === 'toddler') {
    return (
      <>
        <BabyTab data={data} update={update} profileName={profileName} profile={profile} babyLog={babyLog} activeProfileId={activeProfileId} />
        {/* Still show meds if any */}
        {data.meds.length > 0 && (
          <TodayTab
            data={data} isTaken={isTaken} toggleTaken={toggleTaken}
            pct={pct} takenDoses={takenDoses} totalDoses={totalDoses}
            stockAlerts={stockAlerts} profileName={profileName} inventory={[]}
          />
        )}
      </>
    )
  }

  // All others get standard TodayTab + age tips
  return (
    <>
      <TodayTab
        data={data} isTaken={isTaken} toggleTaken={toggleTaken}
        pct={pct} takenDoses={takenDoses} totalDoses={totalDoses}
        stockAlerts={stockAlerts} profileName={profileName} inventory={inventory}
      />
      <AgeTips ageCategory={ageCategory} name={profile?.name || profileName} />
    </>
  )
}
