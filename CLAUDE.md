# CLAUDE.md – אפיון פרויקט BabyCare

## מה הפרויקט

אפליקציית מעקב טיפול בתינוקות להורים ישראלים – **BabyCare**.
מאפשרת מעקב אחר האכלות, חיתולים, שינה, ויטמינים, חום, חיסונים, גדילה ואבני דרך.
**Multi-family**: כל משפחה מנוהלת בנפרד, עם הזמנת שותפים (הורה שני) דרך קוד invite.

**Stack**: React 18 + Vite 5 + Supabase (Auth + Postgres + Realtime + Storage + Edge Functions) + Tailwind CSS + PWA

---

## מבנה קבצים

```
med-tracker/
├── index.html
├── vite.config.js
├── package.json                 ← React 18, Vite 5, @supabase/supabase-js, Tailwind
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml                 ← build: npm run build, publish: dist, SPA redirect
├── .gitignore
├── public/
│   ├── manifest.webmanifest     ← PWA manifest (name: BabyCare, display: standalone, RTL)
│   ├── sw.js                    ← Service Worker
│   ├── icons/                   ← icon-192.png, icon-512.png
│   └── images/                  ← BabyCareLogo.png ועוד
├── supabase/
│   ├── sql/
│   │   └── push.sql             ← טבלת push_subscriptions + RLS
│   └── functions/
│       ├── send-push/           ← Edge Function: שליחת Web Push
│       ├── cron-notifications/  ← Edge Function: cron — שולח התראות מתוזמנות
│       └── delete-family-photos/← Edge Function: מחיקת תמונות Storage בעת מחיקת משפחה
├── tools/
│   └── supabase-cli/            ← Supabase CLI (לא עולה ל-git)
└── src/
    ├── main.jsx                 ← נקודת כניסה React 18, מאזין beforeinstallprompt
    ├── App.jsx                  ← State ראשי, auth gate, 5 טאבים + ניווט + InstallPwaPrompt
    │                              טוען memberProfile מ-members, Realtime על members
    ├── supabase.js              ← Supabase client init
    ├── db.js                    ← כל פעולות Supabase (queries + mutations)
    ├── utils.js                 ← helpers: ageInMonths, ageLabel, genderColor, uid, PIN
    ├── notifications.js         ← מנוע Web Notifications מקומי (scheduling)
    ├── push.js                  ← Web Push: ensurePushSubscription, removePushSubscription
    ├── index.css                ← RTL, Heebo, dark theme, date input icon fix
    ├── components/
    │   ├── AuthScreen.jsx       ← רישום / כניסה / שכחת סיסמה (3 מצבים)
    │   │                          כולל resend confirmation email עם rate limit (localStorage)
    │   ├── FamilySetup.jsx      ← יצירת משפחה / הצטרפות בקוד invite
    │   │                          כולל migration prompt: העברת נתונים ממשפחה ישנה
    │   ├── BabySwitcher.jsx     ← ניהול פרופילי תינוקות (CRUD + תמונה/אווטר)
    │   │                          מייצא: BabyAvatar — משמש בכל מקום
    │   ├── HamburgerMenu.jsx    ← תפריט צד: המשפחה שלנו (הורים+ילדים), הילדים שלנו,
    │   │                          חיסונים, הזמן הורה (rate limit), ייצוא, עריכת פרופיל,
    │   │                          מחיקת חשבון, יציאה
    │   ├── InstallPwaPrompt.jsx ← bottom-sheet להתקנת PWA
    │   ├── ProfilesBar.jsx      ← (קיים — טרם מחובר לאפליקציה הראשית)
    │   ├── DateNavigator.jsx    ← ניווט תאריכים + useDateNav hook
    │   ├── NotificationsButton.jsx ← כפתור + bottom-sheet הגדרות התראות
    │   ├── LoginScreen.jsx      ← מסך PIN (4 ספרות + SHA-256) — optional
    │   ├── MedModal.jsx         ← מודאל הוספה/עריכה תרופה
    │   ├── InventoryModal.jsx   ← מודאל ארון תרופות
    │   └── shared.jsx           ← סגנונות משותפים
    ├── tabs/
    │   ├── DashboardTab.jsx     ← בית: גריד 2 עמודות, כרטיס חום, יומן חום, חיסון הבא, יומן יום
    │   ├── BabyTab.jsx          ← טאב תינוק מורחב (local state — לא מחובר ל-Supabase)
    │   ├── FeedingTab.jsx       ← האכלות + date nav
    │   ├── DiapersTab.jsx       ← חיתולים + date nav
    │   ├── HealthTab.jsx        ← בריאות: תרופות / מרשמים / ארון
    │   ├── VaccinationsTab.jsx  ← פנקס חיסונים (דרך המבורגר בלבד)
    │   └── GrowthTab.jsx        ← התפתחות: מדידות + גרף SVG, אבני דרך
    │                              ברירת מחדל: sub-tab "אבני דרך". state מוחזק ב-App.jsx
    └── data/
        ├── vaccineSchedule.js   ← לוח חיסונים ישראלי + generateVaccinations()
        └── milestones.js        ← אבני דרך התפתחותיות (MILESTONES, CATEGORY_META)
```

---

## Supabase – מסד נתונים

### טבלאות

| טבלה | תיאור |
|------|-------|
| `members` | `id` (= auth.users.id), `email`, `full_name`, `created_at` — פרופיל משתמש |
| `families` | `id`, `name`, `created_by` (UUID, ללא FK), `created_at` |
| `family_members` | `family_id`, `member_id` (FK → members), `role`, `display_name`, `joined_at` |
| `invite_codes` | `family_id`, `code`, `expires_at`, `used_at`, `created_by` |
| `babies` | `family_id`, `name`, `avatar`, `photo_url`, `birth_date`, `gender`, `weight`, `height`, `head_circumference`, `blood_type`, `allergies`, `notes`, `food_type`, `feeds_per_day` |
| `baby_log` | `family_id`, `baby_id`, `type`, `date`, `time`, + שדות לפי type |
| `meds` | תרופות מתוזמנות |
| `med_log` | יומן נטילת תרופות |
| `prescriptions` | מרשמים |
| `inventory` | ארון תרופות |
| `vaccinations` | חיסונים |
| `growth_log` | מדידות גדילה |
| `milestones` | אבני דרך שהושגו |
| `user_settings` | הגדרות משתמש |
| `push_subscriptions` | Web Push |

### baby_log — סוגי entries

```
feed        → food_type, amount (ml), duration (min), notes
diaper      → kind ('pee'|'poop'|'both')
vitamin     → kind ('vitd'|'iron'|'probiotic')
temperature → temperature (numeric °C)
fever_med   → medicine ('paracetamol'|'ibuprofen'), dose_mg, dose_ml
```

### Supabase Storage

| Bucket | סוג | שימוש |
|--------|-----|-------|
| `baby-photos` | Public | תמונות פרופיל תינוקות |

---

## RLS — מדיניות אבטחה

### `members`
- INSERT: `id = auth.uid()`
- UPDATE: `id = auth.uid()`
- SELECT: `id = auth.uid()` **או** חבר באותה משפחה (דרך `get_my_family_ids()`)

### `families`
- INSERT: `created_by = auth.uid()`
- SELECT/UPDATE/DELETE: דרך `get_my_family_ids()` (SECURITY DEFINER function)

### `family_members`
- INSERT: `member_id = auth.uid()`
- SELECT: `member_id = auth.uid()` או `family_id IN get_my_family_ids()`
- DELETE: `member_id = auth.uid()`

### `get_my_family_ids()` — SECURITY DEFINER function
```sql
-- מפרקת רקורסיה בין families ↔ family_members
SELECT family_id FROM family_members WHERE member_id = auth.uid();
```

### Migration SQL שבוצע
```sql
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- family_members: שינוי שם עמודה
ALTER TABLE public.family_members RENAME COLUMN user_id TO member_id;
ALTER TABLE public.family_members
  ADD CONSTRAINT fk_family_members_member
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_family_id_member_id_key UNIQUE (family_id, member_id);
ALTER TABLE public.family_members
  DROP CONSTRAINT IF EXISTS family_members_family_id_user_id_key;

-- תיקון is_family_member לשימוש ב-member_id
CREATE OR REPLACE FUNCTION is_family_member(fid uuid) ...
  WHERE family_id = fid AND member_id = auth.uid()
```

---

## db.js — פונקציות עיקריות

### Members
| פונקציה | תיאור |
|---------|-------|
| `upsertMember(userId, email, fullName)` | יצירה/עדכון רשומת member — נקרא בהרשמה, כניסה, יצירת/הצטרפות למשפחה |
| `getMember(userId)` | שליפת פרטי משתמש |
| `updateMemberProfile(userId, fullName)` | עדכון שם ב-members + Auth metadata |
| `getFamilyMembers(familyId)` | כל חברי המשפחה עם JOIN ל-members (שם + מייל) |

### Family
| פונקציה | תיאור |
|---------|-------|
| `createFamily(userId, displayName)` | יוצר UUID בצד לקוח → INSERT בלי SELECT → מוסיף ל-family_members → שולף |
| `getUserFamily(userId)` | מחזיר `{ family_id, role, families(*) }` |
| `getInviteRateLimit(userId)` | `{ codesThisHour, oldestTimestamp }` — מ-invite_codes |
| `validateInviteCode(code)` | אימות קוד בלי הצטרפות |
| `getFamilyDataSummary(familyId)` | סיכום נתונים לפני migration |
| `joinByCodeWithMigration(code, userId, displayName, migrate)` | הצטרפות + העברת נתונים אופציונלית |

---

## זרימת הצטרפות משפחה (Invite Flow)

```
הורה מזמין:
  HamburgerMenu → צור קוד → createInviteCode()
  rate limit: 3 קודים/שעה, 60 שניות בין קודים (נשמר ב-invite_codes)
  כפתור "העתק קוד" → toast "הקוד הועתק!" (2.5 שניות)

הורה מוזמן:
  FamilySetup → הכנס קוד → validateInviteCode()
  ↓ אם יש נתונים קיימים:
    מסך migration: "יש לך X תינוקות, Y רשומות — להעביר?"
    ✅ כן → joinByCodeWithMigration(..., migrate=true)
    ❌ לא → joinByCodeWithMigration(..., migrate=false)
  ↓ אין נתונים קיימים → הצטרפות ישירה
```

---

## פרופיל משתמש

- `members` = מקור האמת לשם ומייל
- שם מוצג בתפריט: `familyMembers → members.full_name` (מ-DB, לא מ-Auth metadata)
- עריכה: HamburgerMenu → כפתור "✏️ ערוך" → `updateMemberProfile()` → מעדכן members + Auth metadata
- `App.jsx` טוען `memberProfile` ב-useEffect על `user.id` ומעביר ל-HamburgerMenu
- Realtime על `members` ב-App.jsx — `setMemberProfile(payload.new)` בעת UPDATE

---

## PWA

- `public/manifest.webmanifest` — standalone, RTL, עברית
- `public/sw.js` — Service Worker
- `InstallPwaPrompt.jsx` — bottom-sheet להתקנה:
  - **Android/Chrome**: `beforeinstallprompt` event
  - **iOS Safari**: הדרכה ידנית
  - נשמר ב-`localStorage babycare_install_dismissed`

---

## AuthScreen — מצבים ותכונות

`login` | `register` | `forgot`

**resend confirmation email:**
- מופיע אחרי הרשמה בהמתנה לאימות מייל
- rate limit: 3 שליחות/שעה, 60 שניות cooldown בין שליחות
- נשמר ב-`localStorage babycare_resend_attempts`
- קוד: `supabase.auth.resend({ type: 'signup', email })`

---

## ניווט האפליקציה

### 5 טאבים בסרגל התחתון

| טאב | תוכן |
|-----|-------|
| 🏠 בית | DashboardTab |
| 🍼 האכלה | FeedingTab |
| 🌸 חיתולים | DiapersTab |
| 💊 בריאות | HealthTab |
| 📊 התפתחות | GrowthTab |

VaccinationsTab — דרך המבורגר בלבד (`setTab('vaccinations')`)

---

## DashboardTab — מבנה

1. באנר חיסונים שלא בוצעו (לחיץ → VaccinationsTab)
2. גריד 2 עמודות: האכלות | חיתולים | אבני דרך | ויטמינים
3. כרטיס חום רוחב מלא (2 שורות: מידע + כפתורים)
4. יומן מדידות חום + טיפולי חום
5. חיסון הבא
6. יומן היום

### כרטיס אבני דרך
- מציג אבני דרך שטרם הושגו לגיל הנוכחי (expectedMonth ±2)
- אם כולן הושגו → מציג הבאות בתור + גיל צפוי

---

## GrowthTab
- ברירת מחדל: sub-tab **אבני דרך**
- `growthView` state מוחזק ב-App.jsx

---

## BabyAvatar
מיוצא מ-`BabySwitcher.jsx`:
```jsx
import BabySwitcher, { BabyAvatar } from '../components/BabySwitcher'
<BabyAvatar baby={activeBaby} size={40} />
```
- `photo_url` קיים → תמונה עגולה
- אחרת → emoji `avatar` / '👶'

---

## צבעים ועיצוב

```
background: #0d1117  card: #161b22  border: #30363d
female: #f472b6  male: #60a5fa  unknown: #a78bfa
success: #22c55e  warning: #f59e0b  danger: #ef4444
```
גופן: **Heebo** – RTL עברית

**Date input icon**: `input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) }` ב-index.css

---

## הפעלה לוקאלית

```bash
cd "d:/backup/Sites In Build/med-tracker"
npm install
npm run dev       # http://localhost:5174
npm run build
```

---

## כללים חשובים

1. **Supabase = מקור האמת** — localStorage רק ל-`babycare_active`, `babycare_install_dismissed`, `babycare_resend_attempts`
2. כל mutation → `await db.xxx()` → `await reload()`
3. RLS — המשתמש רואה רק נתוני המשפחות שלו
4. `themeColor` = `genderColor(activeBaby.gender)` — מועבר כ-prop לכל טאב
5. **onClick handlers**: תמיד `onClick={() => fn(arg)}` ולא `onClick={fn}`
6. VaccinationsTab — `setTab('vaccinations')` בלבד
7. `BabyTab.jsx` — קיים אך **לא מחובר ל-Supabase** (local state בלבד)
8. `ProfilesBar.jsx` — קיים אך **לא מחובר לאפליקציה** (תלוי ב-`../ageProfiles` שלא קיים)
9. `family_members` משתמש ב-`member_id` (לא `user_id` — שונה ב-migration)
10. `createFamily` יוצר UUID בצד לקוח כי RLS חוסם SELECT לפני INSERT ל-family_members
11. `get_my_family_ids()` — SECURITY DEFINER function שמפרקת רקורסיה ב-RLS
12. לבדוק RTL + מובייל אחרי כל שינוי CSS
