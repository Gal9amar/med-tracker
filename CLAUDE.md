# CLAUDE.md – אפיון פרויקט BabyCare

## מה הפרויקט

אפליקציית מעקב טיפול בתינוקות להורים ישראלים – **BabyCare**.
מאפשרת מעקב אחר האכלות, חיתולים, ויטמינים, חום, חיסונים, גדילה ואבני דרך.
**Multi-family**: כל משפחה מנוהלת בנפרד, עם הזמנת שותפים (הורה שני) דרך קוד invite.

**Stack**: React 18 + Vite 5 + Supabase (Auth + Postgres + Realtime)

---

## מבנה קבצים

```
med-tracker/
├── index.html                   ← כניסה, RTL עברית, Heebo, כותרת BabyCare
├── vite.config.js               ← Vite + React plugin
├── package.json                 ← React 18, Vite 5, @supabase/supabase-js
├── src/
│   ├── main.jsx                 ← נקודת כניסה React 18
│   ├── App.jsx                  ← State ראשי, auth gate, 5 טאבים + ניווט
│   ├── supabase.js              ← Supabase client init
│   ├── db.js                    ← כל פעולות Supabase (queries + mutations)
│   ├── utils.js                 ← helpers: ageInMonths, ageLabel, genderColor, PIN
│   ├── notifications.js         ← מנוע push notifications (scheduling, כל סוגי ההתראות)
│   ├── index.css                ← RTL, Heebo, dark theme
│   ├── components/
│   │   ├── AuthScreen.jsx       ← רישום / כניסה (Supabase email+password)
│   │   ├── FamilySetup.jsx      ← יצירת משפחה חדשה או הצטרפות בקוד invite
│   │   ├── BabySwitcher.jsx     ← ניהול פרופילי תינוקות (CRUD + כל שדות הפרופיל)
│   │   ├── HamburgerMenu.jsx    ← תפריט צד: ניהול תינוקות, פנקס חיסונים, הזמנת הורה, ייצוא, יציאה
│   │   ├── DateNavigator.jsx    ← ניווט תאריכים (prev/next) + useDateNav hook
│   │   │                          direction: ltr, ‹ שמאל = קדימה, › ימין = אתמול
│   │   ├── NotificationsButton.jsx ← כפתור + bottom-sheet הגדרות, מתזמן כל ההתראות
│   │   ├── LoginScreen.jsx      ← מסך PIN (4 ספרות + SHA-256) — optional
│   │   ├── MedModal.jsx         ← מודאל הוספה/עריכה תרופה
│   │   ├── InventoryModal.jsx   ← מודאל ארון תרופות
│   │   └── shared.jsx           ← סגנונות משותפים
│   ├── tabs/
│   │   ├── DashboardTab.jsx     ← בית: סיכום יומי, כרטיסי האכלה/חום/ויטמינים/תרופות
│   │   ├── FeedingTab.jsx       ← האכלות: תיעוד + היסטוריה + date nav
│   │   ├── DiapersTab.jsx       ← חיתולים: תיעוד + היסטוריה + date nav
│   │   ├── HealthTab.jsx        ← בריאות: תרופות / מרשמים / ארון (3 sub-tabs)
│   │   ├── VaccinationsTab.jsx  ← פנקס חיסונים (נגיש דרך המבורגר בלבד, לא בטאב-בר)
│   │   └── GrowthTab.jsx        ← התפתחות: מדידות + גרף SVG, אבני דרך
│   └── data/
│       ├── vaccineSchedule.js   ← לוח חיסונים ישראלי מלא + generateVaccinations()
│       └── milestones.js        ← אבני דרך התפתחותיות לפי גיל
```

---

## Supabase – מסד נתונים

### טבלאות

| טבלה | תיאור |
|------|-------|
| `families` | יחידה משפחתית: `id`, `name`, `created_by` |
| `family_members` | `family_id`, `user_id`, `role` (owner/member) |
| `invite_codes` | `family_id`, `created_by`, `code`, `expires_at`, `used_at` |
| `babies` | פרופיל תינוק: `family_id`, `name`, `avatar`, `birth_date`, `gender`, `weight`, `height`, `head_circumference`, `blood_type`, `allergies`, `notes`, `food_type`, `feeds_per_day` |
| `baby_log` | לוג יומי: `family_id`, `baby_id`, `type`, `date`, `time`, + שדות ספציפיים לפי type |
| `meds` | תרופות מתוזמנות: `family_id`, `baby_id`, `name`, `dose`, `times`, `time_hours`, `instructions`, `expiry`, `color`, `stock_count`, `stock_alert` |
| `med_log` | יומן נטילת תרופות: `family_id`, `baby_id`, `med_id`, `date`, `time` |
| `prescriptions` | מרשמים: `family_id`, `baby_id`, `med_name`, `doctor_name`, `hmo`, `date`, `months`, `quantity`, `notes` |
| `inventory` | ארון תרופות: `family_id`, `name`, `quantity`, `location`, `instructions`, `expiry`, `notes` |
| `vaccinations` | חיסונים: `family_id`, `baby_id`, `vaccine_id`, `name`, `vaccine_group`, `age_label`, `scheduled_date`, `actual_date`, `status`, `clinic`, `doctor`, `batch_number`, `side_effects` |
| `growth_log` | מדידות גדילה: `family_id`, `baby_id`, `date`, `weight`, `height`, `head_circumference`, `notes` |
| `milestones` | אבני דרך שהושגו: `family_id`, `baby_id`, `milestone_id`, `achieved_date` |

### baby_log — סוגי entries (שדה `type`)

```
type: 'feed'        → food_type ('breast'|'formula'|'solids'), amount (ml), duration (min), notes
type: 'diaper'      → kind ('pee'|'poop'|'both'), notes
type: 'vitamin'     → kind ('vitd'|'iron'|'probiotic'), name
type: 'temperature' → temperature (numeric, °C)
type: 'fever_med'   → medicine ('paracetamol'|'ibuprofen'), dose_mg, dose_ml
```

> **חשוב**: טבלת `baby_log` צריכה את העמודות הנוספות הבאות (הוסף אם חסרות):
> ```sql
> ALTER TABLE baby_log
>   ADD COLUMN IF NOT EXISTS temperature  numeric,
>   ADD COLUMN IF NOT EXISTS medicine     text,
>   ADD COLUMN IF NOT EXISTS dose_mg      numeric,
>   ADD COLUMN IF NOT EXISTS dose_ml      numeric;
> ```

### Row Level Security (RLS)

כל הטבלאות מוגנות ב-RLS. משתמש רואה רק נתוני המשפחות שהוא חבר בהן דרך `family_members`.

### Realtime

App.jsx מנוי ל-realtime על כל הטבלאות בערוץ `family-{familyId}`. כל שינוי (INSERT/UPDATE/DELETE) מפעיל `loadBabyData()` או `loadBabies()`.

---

## ניווט האפליקציה

### 5 טאבים בסרגל התחתון

| טאב | Icon | תוכן |
|-----|------|-------|
| 🏠 בית | home | DashboardTab |
| 🍼 האכלה | feeding | FeedingTab |
| 🌸 חיתולים | diapers | DiapersTab |
| 💊 בריאות | health | HealthTab |
| 📊 התפתחות | growth | GrowthTab |

### פנקס חיסונים (VaccinationsTab)

נגיש **דרך תפריט ההמבורגר בלבד** (לא בסרגל הטאבים). לחיצה על "פנקס חיסונים" בתפריט מבצעת `setTab('vaccinations')`.

### תפריט המבורגר (HamburgerMenu)

פתיח מכפתור ☰ בפינה ימנית למעלה. כולל:
- ניהול תינוקות
- פנקס חיסונים
- הזמן הורה לשיתוף (קוד invite חד-פעמי, תקף 48 שעות)
- ייצוא נתונים
- יציאה מהחשבון

---

## DashboardTab — לוח הבית

### כרטיסים

| כרטיס | תוכן |
|-------|-------|
| `FeedingCard` | מס' האכלות מתוך `feeds_per_day`, האכלה הבאה בשעה X, progress bar |
| `TempCard` | טמפרטורה אחרונה, כפתור "טיפול בחום" אם ≥38°, זמן מנה הבאה ומה לתת |
| `VitaminCard` | ויטמינים לפי גיל (D/ברזל/פרוביוטיקה) + toggle לסימון שניתן |
| `MedicineCard` | כמה מנות ניתנו היום מתוך סך מינונים מתוכננים |

### פרוטוקול חום (טיפת חלב)

- **פרצטמול (נובימול/אקמולי)**: 15mg/kg, כל 4 שעות, סירופ 24mg/ml
- **איבופרופן (אקמולי/אדוויל)**: 10mg/kg, כל 6 שעות, סירופ 20mg/ml — מגיל 6 חודשים
- אם ניסיון לתת מנה לפני הזמן → מודאל אזהרה עם זמנים מדויקים

### פרוטוקול ויטמינים (טיפת חלב)

```
ויטמין D — מגיל לידה עד 24 חודש, 400 IU
ברזל      — מגיל 4–18 חודשים, 1mg/kg/יום
פרוביוטיקה — מגיל לידה עד 12 חודשים, לפי הוראה
```

---

## מנוע ההתראות — notifications.js

כל ההתראות מנוהלות ב-`src/notifications.js` (לא ב-utils.js).

### סוגי התראות

| סוג | תזמון |
|-----|-------|
| 🍼 האכלה הבאה | לפי מרווח `feeds_per_day` מהאכלה האחרונה |
| 💊 מנת חום — פרצטמול | בדיוק 4 שעות אחרי המנה האחרונה |
| 💊 מנת חום — איבופרופן | בדיוק 6 שעות אחרי המנה האחרונה (6m+) |
| 🌡️ בדיקת חום | כל 2 שעות כשקיימת קדחת ≥38° |
| 💊 תרופות מתוזמנות | לפי שעות הנטילה שמוגדרות בכרטיס הבריאות |
| 💉 חיסון מחר | יום לפני, 09:00 |
| 💉 חיסון היום | ביום החיסון, 09:00 |
| ⚠️ חיסון באיחור | פעם אחת כשנטענת האפליקציה |

### API

```js
import { requestPermission, hasPermission, scheduleAllNotifications, cancelAllNotifications } from './notifications'

// בקש הרשאה
await requestPermission()

// תזמן את כל ההתראות (מבטל ומחדש בכל קריאה)
scheduleAllNotifications({ activeBaby, babyLog, meds, vaccinations })
```

`NotificationsButton.jsx` קורא ל-`scheduleAllNotifications` בכל שינוי נתונים (useEffect).
כפתור ה-🔔 פותח bottom-sheet עם רשימת כל ההתראות הפעילות.

---

## צבעים ועיצוב

```css
/* רקע */
background: #0d1117    ← מסך ראשי
card:       #161b22    ← כרטיסים, header, bottom nav
border:     #30363d

/* צבע לפי מגדר התינוק – genderColor(gender) */
female → #f472b6   (pink)
male   → #60a5fa   (blue)
unknown→ #a78bfa   (purple, ברירת מחדל בכל מסכי הגדרה/auth)

/* סטטוסים */
success: #22c55e
warning: #f59e0b
danger:  #ef4444
```

- `genderColor(gender)` ו-`genderColorLight(gender)` מ-`utils.js` — לצביעה דינמית לפי מגדר
- כל מסכי auth / FamilySetup / LoginScreen משתמשים ב-`#a78bfa` (ללא תינוק פעיל)
- גופן: **Heebo** (Google Fonts) – RTL עברית

---

## DateNavigator

```jsx
// direction: ltr — כך הכפתורים נמצאים במיקום הפיזי הנכון
// ‹ שמאל  = קדימה (היום) — disabled כשisToday
// › ימין  = אחורה (אתמול)
<DateNavigator dateLabel={dateLabel} isToday={isToday} onBack={goBack} onForward={goForward} color={themeColor} />
```

---

## Flow משתמש חדש

```
AuthScreen (email+password)
  → FamilySetup → יצירת משפחה חדשה
              ↘ הצטרפות בקוד invite ← קוד נוצר ב-HamburgerMenu → שיתוף
  → אין תינוק? → הודעה + כפתור "הוסף תינוק"
  → BabySwitcher → הוספת תינוק → generateVaccinations אוטומטי
  → App עם 5 טאבים
```

---

## db.js — פונקציות עיקריות

```js
// Auth
signUp(email, password, displayName)
signIn(email, password)
signOut()

// Family
getUserFamily(userId)
createFamily(userId, familyName)
joinFamilyByCode(userId, code)
createInviteCode(familyId, userId)

// Babies
getBabies(familyId)
addBaby(familyId, babyData)
updateBaby(babyId, updates)
deleteBaby(babyId)

// Logs
getBabyLog(familyId, babyId)
addLog(familyId, babyId, logData)
deleteLog(logId)

// Meds, medLog, prescriptions, inventory, vaccinations, growthLog, milestones
// → כל אחד: get/add/update/delete
```

---

## הפעלה לוקאלית

```bash
cd "d:/backup/Sites In Build/med-tracker"
npm install       # רק בפעם הראשונה
npm run dev       # http://localhost:5174
npm run build     # בדיקת build production
```

---

## כללים חשובים

1. **Supabase = מקור האמת** — אין localStorage לנתוני תינוקות (localStorage משמש רק ל-`babycare_active` — זיכרון התינוק הפעיל)
2. כל mutation → `await db.xxx()` → `await reload()` — חובה לרענן State
3. RLS מוגדר — המשתמש רואה רק נתוני המשפחות שלו
4. `themeColor` = `genderColor(activeBaby.gender)` — מועבר כ-prop לכל טאב
5. `babyLog.type` = `'feed' | 'diaper' | 'vitamin' | 'temperature' | 'fever_med'`
6. VaccinationsTab נגיש דרך `setTab('vaccinations')` בלבד — אין כניסה ישירה מהטאב-בר
7. לבדוק RTL + מובייל אחרי כל שינוי CSS
8. אל תוסיף תלויות חדשות ללא סיבה מוצדקת
