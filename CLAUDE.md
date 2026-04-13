# CLAUDE.md – אפיון פרויקט BabyCare

## מה הפרויקט

אפליקציית מעקב טיפול בתינוקות להורים ישראלים – **BabyCare**.
מאפשרת מעקב אחר האכלות, חיתולים, ויטמינים, חום, חיסונים, גדילה ואבני דרך.
**Multi-family**: כל משפחה מנוהלת בנפרד, עם הזמנת שותפים (הורה שני) דרך קוד invite.

**Stack**: React 18 + Vite 5 + Supabase (Auth + Postgres + Realtime + Storage)

---

## מבנה קבצים

```
med-tracker/
├── index.html                   ← כניסה, RTL עברית, Heebo, כותרת BabyCare
├── vite.config.js               ← Vite + React plugin
├── package.json                 ← React 18, Vite 5, @supabase/supabase-js
├── .gitignore                   ← node_modules, dist, .env*, .DS_Store, logs
├── src/
│   ├── main.jsx                 ← נקודת כניסה React 18
│   ├── App.jsx                  ← State ראשי, auth gate, 5 טאבים + ניווט
│   ├── supabase.js              ← Supabase client init
│   ├── db.js                    ← כל פעולות Supabase (queries + mutations)
│   ├── utils.js                 ← helpers: ageInMonths, ageLabel, genderColor, PIN
│   ├── notifications.js         ← מנוע push notifications (scheduling, כל סוגי ההתראות)
│   ├── index.css                ← RTL, Heebo, dark theme
│   ├── components/
│   │   ├── AuthScreen.jsx       ← רישום / כניסה / שכחת סיסמה (Supabase email+password)
│   │   ├── FamilySetup.jsx      ← יצירת משפחה חדשה או הצטרפות בקוד invite
│   │   ├── BabySwitcher.jsx     ← ניהול פרופילי תינוקות (CRUD + תמונה/אווטר)
│   │   │                          מייצא גם את BabyAvatar — משמש בכל מקום שמציג תמונה/אמוג'י
│   │   ├── HamburgerMenu.jsx    ← תפריט צד: ניהול תינוקות, פנקס חיסונים, הזמנת הורה,
│   │   │                          ייצוא, מחיקת חשבון, יציאה
│   │   ├── DateNavigator.jsx    ← ניווט תאריכים (prev/next) + useDateNav hook
│   │   │                          direction: ltr, ‹ שמאל = קדימה, › ימין = אתמול
│   │   ├── NotificationsButton.jsx ← כפתור + bottom-sheet הגדרות, מתזמן כל ההתראות
│   │   ├── LoginScreen.jsx      ← מסך PIN (4 ספרות + SHA-256) — optional
│   │   ├── MedModal.jsx         ← מודאל הוספה/עריכה תרופה
│   │   ├── InventoryModal.jsx   ← מודאל ארון תרופות
│   │   └── shared.jsx           ← סגנונות משותפים
│   ├── tabs/
│   │   ├── DashboardTab.jsx     ← בית: גריד 2 עמודות (האכלה/חיתולים/אבני דרך/ויטמינים),
│   │   │                          כרטיס חום רוחב מלא, יומן יומי
│   │   ├── FeedingTab.jsx       ← האכלות: תיעוד + היסטוריה + date nav
│   │   ├── DiapersTab.jsx       ← חיתולים: תיעוד + היסטוריה + date nav
│   │   ├── HealthTab.jsx        ← בריאות: תרופות / מרשמים / ארון (3 sub-tabs)
│   │   ├── VaccinationsTab.jsx  ← פנקס חיסונים (נגיש דרך המבורגר בלבד, לא בטאב-בר)
│   │   └── GrowthTab.jsx        ← התפתחות: מדידות + גרף SVG, אבני דרך
│   │                              ברירת מחדל: sub-tab "אבני דרך". state מוחזק ב-App.jsx (growthView)
│   └── data/
│       ├── vaccineSchedule.js   ← לוח חיסונים ישראלי מלא + generateVaccinations()
│       └── milestones.js        ← אבני דרך התפתחותיות לפי גיל (MILESTONES, CATEGORY_META)
```

---

## Supabase – מסד נתונים

### טבלאות

| טבלה | תיאור |
|------|-------|
| `families` | יחידה משפחתית: `id`, `name`, `created_by` |
| `family_members` | `family_id`, `user_id`, `role` (owner/member) |
| `invite_codes` | `family_id`, `created_by`, `code`, `expires_at`, `used_at` |
| `babies` | פרופיל תינוק: `family_id`, `name`, `avatar`, `photo_url`, `birth_date`, `gender`, `weight`, `height`, `head_circumference`, `blood_type`, `allergies`, `notes`, `food_type`, `feeds_per_day` |
| `baby_log` | לוג יומי: `family_id`, `baby_id`, `type`, `date`, `time`, + שדות ספציפיים לפי type |
| `meds` | תרופות מתוזמנות: `family_id`, `baby_id`, `name`, `dose`, `times`, `time_hours`, `instructions`, `expiry`, `color`, `stock_count`, `stock_alert` |
| `med_log` | יומן נטילת תרופות: `family_id`, `baby_id`, `med_id`, `date`, `time` |
| `prescriptions` | מרשמים: `family_id`, `baby_id`, `med_name`, `doctor_name`, `hmo`, `date`, `months`, `quantity`, `notes` |
| `inventory` | ארון תרופות: `family_id`, `name`, `quantity`, `location`, `instructions`, `expiry`, `notes` |
| `vaccinations` | חיסונים: `family_id`, `baby_id`, `vaccine_id`, `name`, `vaccine_group`, `age_label`, `scheduled_date`, `actual_date`, `status`, `clinic`, `doctor`, `batch_number`, `side_effects` |
| `growth_log` | מדידות גדילה: `family_id`, `baby_id`, `date`, `weight`, `height`, `head_circumference`, `notes` |
| `milestones` | אבני דרך שהושגו: `family_id`, `baby_id`, `milestone_id`, `achieved_date` |
| `user_settings` | הגדרות משתמש: `user_id`, ... |

### baby_log — סוגי entries (שדה `type`)

```
type: 'feed'        → food_type ('breast'|'formula'|'solids'), amount (ml), duration (min), notes
type: 'diaper'      → kind ('pee'|'poop'|'both'), notes
type: 'vitamin'     → kind ('vitd'|'iron'|'probiotic'), name
type: 'temperature' → temperature (numeric, °C)
type: 'fever_med'   → medicine ('paracetamol'|'ibuprofen'), dose_mg, dose_ml
```

> **Migration נדרש** — הוסף עמודות אם חסרות:
> ```sql
> ALTER TABLE baby_log
>   ADD COLUMN IF NOT EXISTS temperature  numeric,
>   ADD COLUMN IF NOT EXISTS medicine     text,
>   ADD COLUMN IF NOT EXISTS dose_mg      numeric,
>   ADD COLUMN IF NOT EXISTS dose_ml      numeric,
>   ADD COLUMN IF NOT EXISTS kind         text;
>
> ALTER TABLE babies
>   ADD COLUMN IF NOT EXISTS photo_url text;
> ```

### Supabase Storage

| Bucket | סוג | שימוש |
|--------|-----|-------|
| `baby-photos` | Public | תמונות פרופיל תינוקות |

**RLS נדרש על Storage:**
```sql
create policy "Authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'baby-photos');

create policy "Authenticated update"
on storage.objects for update to authenticated
using (bucket_id = 'baby-photos');
```

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
לחיצה על באנר חיסונים שלא בוצעו ב-Dashboard גם מנווטת לשם.

### תפריט המבורגר (HamburgerMenu)

פתיח מכפתור ☰ בפינה ימנית למעלה. כולל:
- ניהול תינוקות
- פנקס חיסונים
- הזמן הורה לשיתוף (קוד invite חד-פעמי, תקף 48 שעות)
- ייצוא נתונים
- מחיקת חשבון וכל הנתונים (דורש הקלדת "מחק חשבון" לאישור)
- יציאה מהחשבון

---

## DashboardTab — לוח הבית

### מבנה

1. **באנר התראות** — חיסונים שלא בוצעו (לחיץ → VaccinationsTab). חום הוסר מהבאנר.
2. **גריד 2 עמודות**: האכלות | חיתולים | אבני דרך | ויטמינים
3. **כרטיס חום רוחב מלא** — מציג טמפרטורה אחרונה + כפתורי "טיפול" ו-"מדוד"
4. **יומן מדידות חום + טיפולי חום** — מוצג ישירות מתחת לכרטיס החום
5. **חיסון הבא** — תאריך + ספירת ימים
6. **יומן היום** — האכלות + חיתולים בלבד

### כרטיס אבני דרך (Dashboard)

- מציג אבני דרך **שטרם הושגו** לגיל הנוכחי (expectedMonth ±2)
- אם כולן הושגו → מציג הבאות בתור עם גיל צפוי
- כפתור "הצג הכל ›" מנווט ל-GrowthTab

### פרוטוקול חום (טיפת חלב)

- **פרצטמול (נובימול)**: 15mg/kg, כל 4 שעות, סירופ 24mg/ml
- **איבופרופן (אקמולי)**: 10mg/kg, כל 6 שעות, סירופ 20mg/ml — מגיל 6 חודשים
- אם ניסיון לתת מנה לפני הזמן → מודאל אזהרה עם זמנים מדויקים

### פרוטוקול ויטמינים (טיפת חלב)

```
ויטמין D — מגיל לידה עד 24 חודש, 400 IU
ברזל      — מגיל 4–18 חודשים, 1mg/kg/יום
פרוביוטיקה — מגיל לידה עד 12 חודשים, לפי הוראה
```

---

## GrowthTab

- ברירת מחדל: sub-tab **אבני דרך** (לא מדידות)
- ה-state `growthView` מוחזק ב-**App.jsx** ומועבר כ-props — מונע איפוס בעת reload
- לחיצה על שורת אבן דרך שלמה (לא רק הכפתור) מסמנת/מבטלת

---

## BabyAvatar — קומפוננטה משותפת

מיוצאת מ-`BabySwitcher.jsx`:

```jsx
import { BabyAvatar } from '../components/BabySwitcher'
// או
import BabySwitcher, { BabyAvatar } from '../components/BabySwitcher'

<BabyAvatar baby={activeBaby} size={40} />
```

- אם `baby.photo_url` קיים → מציג תמונה עגולה
- אחרת → מציג emoji `baby.avatar` או '👶'
- משמש ב: App.jsx header, baby chips, BabySwitcher list, GrowthTab, confirm-delete modal

---

## AuthScreen — מצבים

| מצב | תיאור |
|-----|-------|
| `login` | כניסה עם אימייל + סיסמה |
| `register` | הרשמה עם שם + אימייל + סיסמה |
| `forgot` | שכחת סיסמה — שולח מייל איפוס דרך `supabase.auth.resetPasswordForEmail()` |

---

## מנוע ההתראות — notifications.js

כל ההתראות מנוהלות ב-`src/notifications.js`.

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

- `genderColor(gender)` ו-`genderColorLight(gender)` מ-`utils.js`
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
AuthScreen (email+password / forgot password)
  → FamilySetup → יצירת משפחה חדשה
              ↘ הצטרפות בקוד invite ← קוד נוצר ב-HamburgerMenu → שיתוף
  → אין תינוק? → הודעה + כפתור "הוסף תינוק"
  → BabySwitcher → הוספת תינוק (+ תמונה/אווטר) → generateVaccinations אוטומטי
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
addBaby(familyId, babyData)       // כולל photo_url
updateBaby(babyId, updates)
deleteBaby(babyId)
deleteAllFamilyData(familyId, userId)  // מחיקת כל נתוני המשפחה + יציאה

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
7. **onClick handlers**: תמיד `onClick={() => fn(arg)}` ולא `onClick={fn}` כשהפונקציה מקבלת arguments — אחרת React מעביר את ה-SyntheticEvent כ-argument ראשון
8. לבדוק RTL + מובייל אחרי כל שינוי CSS
9. אל תוסיף תלויות חדשות ללא סיבה מוצדקת
