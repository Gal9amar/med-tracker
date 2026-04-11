import { useState, useEffect } from 'react'
import { requestNotificationPermission, scheduleDailyReminders } from '../utils'

export default function NotificationsButton({ meds, profileName }) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if (permission === 'granted') scheduleDailyReminders(meds, profileName)
  }, [meds, profileName, permission])

  const handleClick = async () => {
    if (permission === 'granted') {
      scheduleDailyReminders(meds, profileName)
      alert('✅ תזכורות מתוזמנות להיום!')
      return
    }
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    if (granted) {
      scheduleDailyReminders(meds, profileName)
      alert('✅ התראות הופעלו! תזכורות יישלחו בזמני הלקיחה.')
    } else {
      alert('❌ לא ניתן לשלוח התראות. אפשר בהגדרות הדפדפן.')
    }
  }

  return (
    <button onClick={handleClick} title={permission === 'granted' ? 'תזכורות פעילות' : 'הפעל תזכורות'} style={{
      background: permission === 'granted' ? '#22c55e22' : '#21262d',
      border: `1px solid ${permission === 'granted' ? '#22c55e44' : '#30363d'}`,
      borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
      fontSize: 18, display: 'flex', alignItems: 'center', gap: 4
    }}>
      {permission === 'granted' ? '🔔' : '🔕'}
    </button>
  )
}
