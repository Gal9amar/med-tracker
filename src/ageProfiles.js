// Age categories with metadata
export const AGE_CATEGORIES = [
  { id: 'baby',    label: 'תינוק',   range: '0-1',   icon: '👶', color: '#f472b6', description: 'עד גיל שנה' },
  { id: 'toddler', label: 'פעוט',    range: '1-3',   icon: '🧒', color: '#fb923c', description: 'גיל 1-3' },
  { id: 'child',   label: 'ילד',     range: '3-12',  icon: '🧒', color: '#34d399', description: 'גיל 3-12' },
  { id: 'teen',    label: 'מתבגר',  range: '12-18', icon: '🧑', color: '#60a5fa', description: 'גיל 12-18' },
  { id: 'adult',   label: 'מבוגר',  range: '18-65', icon: '👤', color: '#a78bfa', description: 'גיל 18-65' },
  { id: 'senior',  label: 'קשיש',   range: '65+',   icon: '👴', color: '#fbbf24', description: 'גיל 65+' },
]

export const AGE_AVATARS = {
  baby:    ['👶', '🍼', '🌸', '⭐'],
  toddler: ['🧒', '🎠', '🌈', '🐣'],
  child:   ['🧒', '🎒', '⚽', '🎨'],
  teen:    ['🧑', '🎮', '🎵', '📱'],
  adult:   ['👤', '👨', '👩', '🧑'],
  senior:  ['👴', '👵', '🧓', '☕'],
}

// Derive age category from birth date
export function getCategoryFromBirthDate(birthDate) {
  if (!birthDate) return 'adult'
  const birth = new Date(birthDate)
  const now = new Date()
  const ageMs = now - birth
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25)
  if (ageYears < 1)  return 'baby'
  if (ageYears < 3)  return 'toddler'
  if (ageYears < 12) return 'child'
  if (ageYears < 18) return 'teen'
  if (ageYears < 65) return 'adult'
  return 'senior'
}

// Human-readable age string
export function getAgeLabel(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(months / 12)
  if (months < 1) return 'פחות מחודש'
  if (months < 12) return months === 1 ? 'חודש אחד' : `${months} חודשים`
  if (years < 2) return `שנה ו-${months - 12} חודשים`
  return `${years} שנים`
}

export const AGE_TIPS = {
  baby: [
    'תינוקות זקוקים לוויטמין D מהשבוע הראשון לחיים',
    'ברזל חשוב במיוחד מגיל 4 חודשים',
    'מעקב צמיחה חודשי חיוני בשנה הראשונה',
  ],
  toddler: [
    'ויטמין D וסידן חשובים לבניית עצמות',
    'בדיקת ברזל מומלצת בגיל שנה',
    'חיסונים: חשוב לעדכן לוח חיסונים',
  ],
  child: [
    'ויטמין D חשוב גם לילדים',
    'מעקב גובה ומשקל פעם בשנה אצל רופא ילדים',
    'שינה מספקת חיונית לגדילה',
  ],
  teen: [
    'ברזל חשוב במיוחד לבנות מתבגרות',
    'סידן וויטמין D לחיזוק עצמות',
    'שינה מספקת (8-10 שעות) קריטית',
  ],
  adult: [
    'בדיקות דם שגרתיות פעם בשנה',
    'ויטמין D מומלץ לרוב האוכלוסייה',
    'פעילות גופנית סדירה מפחיתה סיכונים',
  ],
  senior: [
    'סידן וויטמין D מניעת אוסטאופורוזיס',
    'בדיקת לחץ דם וסוכר פעם בשנה',
    'תשומת לב לאינטראקציות בין תרופות',
    'מעקב אחר תרופות מרובות חשוב מאוד',
  ],
}
