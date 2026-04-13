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
├── .gitignore                   ← node_modules, dist, .env*, tools/supabase-cli/, supabase/.temp/
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
    ├── supabase.js              ← Supabase client init
    ├── db.js                    ← כל פעולות Supabase (queries + mutations)
    ├── utils.js                 ← helpers: ageInMonths, ageLabel, genderColor, uid, PIN
    ├── notifications.js         ← מנוע Web Notifications מקומי (scheduling)
    ├── push.js                  ← Web Push: ensurePushSubscription, removePushSubscription
    ├── index.css                ← RTL, Heebo, dark theme
    ├── components/
    │   ├── AuthScreen.jsx       ← רישום / כניסה / שכחת סיסמה (3 מצבים)
    │   ├── FamilySetup.jsx      ← יצירת משפחה חדשה / הצטרפות בקוד invite
    │   ├── BabySwitcher.jsx     ← ניהול פרופילי תינוקות (CRUD + תמונה/אווטר)
    │   │                          מייצא: BabyAvatar — משמש בכל מקום
    │   ├── HamburgerMenu.jsx    ← תפריט צד: ניהול תינוקות, חיסונים, הזמנת הורה,
    │   │                          ייצוא, מחיקת חשבון, יציאה
    │   ├── InstallPwaPrompt.jsx ← bottom-sheet להתקנת PWA (Android: beforeinstallprompt, iOS: הדרכה)
    │   ├── ProfilesBar.jsx      ← (קיים — טרם מחובר לאפליקציה הראשית)
    │   ├── DateNavigator.jsx    ← ניווט תאריכים + useDateNav hook
    │   ├── NotificationsButton.jsx ← כפתור + bottom-sheet הגדרות התראות
    │   ├── LoginScreen.jsx      ← מסך PIN (4 ספרות + SHA-256) — optional
    │   ├── MedModal.jsx         ← מודאל הוספה/עריכה תרופה
    │   ├── InventoryModal.jsx   ← מודאל ארון תרופות
    │   └── shared.jsx           ← סגנונות משותפים (overlay, sheet, inputStyle, labelStyle)
    ├── tabs/
    │   ├── DashboardTab.jsx     ← בית: גריד 2 עמודות, כרטיס חום, יומן חום, חיסון הבא, יומן יום
    │   ├── BabyTab.jsx          ← טאב תינוק מורחב: האכלה, חיתולים, שינה, חום, ויטמינים
    │   │                          (local state — לא מחובר ל-Supabase עדיין)
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
| `families` | `id`, `name`, `created_by` |
| `family_members` | `family_id`, `user_id`, `role` |
| `invite_codes` | `family_id`, `code`, `expires_at`, `used_at` |
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
| `push_subscriptions` | Web Push: `user_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, `updated_at` |

### baby_log — סוגי entries

```
feed        → food_type, amount (ml), duration (min), notes
diaper      → kind ('pee'|'poop'|'both')
vitamin     → kind ('vitd'|'iron'|'probiotic')
temperature → temperature (numeric °C)
fever_med   → medicine ('paracetamol'|'ibuprofen'), dose_mg, dose_ml
```

> **Migration נדרש:**
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

```sql
create policy "Authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'baby-photos');

create policy "Authenticated update"
on storage.objects for update to authenticated
using (bucket_id = 'baby-photos');
```

### Edge Functions

| Function | תיאור |
|----------|-------|
| `send-push` | שולחת Web Push notification למנויים |
| `cron-notifications` | cron — שולח התראות מתוזמנות (חיסונים, תרופות וכו') |
| `delete-family-photos` | מוחקת תמונות Storage בעת מחיקת משפחה |

### Web Push

- `push.js` — `ensurePushSubscription(user)` רושם המכשיר ושומר ב-`push_subscriptions`
- `removePushSubscription()` — מבטל מנוי ומוחק מה-DB
- `VITE_VAPID_PUBLIC_KEY` נדרש ב-`.env`

---

## PWA

- `public/manifest.webmanifest` — standalone, RTL, עברית
- `public/sw.js` — Service Worker
- `InstallPwaPrompt.jsx` — bottom-sheet להתקנה:
  - **Android/Chrome**: משתמש ב-`beforeinstallprompt` event
  - **iOS Safari**: מציג הדרכה ידנית (שתף → הוסף למסך הבית)
  - נשמר ב-`localStorage babycare_install_dismissed`
  - `window.__babycareBeforeInstallPrompt` — נשמר ב-`main.jsx` לפני mount

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
3. כרטיס חום רוחב מלא (טמפרטורה + כפתורי "טיפול" / "+ מדוד")
4. יומן מדידות חום + טיפולי חום (מתחת לכרטיס חום)
5. חיסון הבא
6. יומן היום (האכלות + חיתולים)

### כרטיס אבני דרך
- מציג אבני דרך שטרם הושגו לגיל הנוכחי (expectedMonth ±2)
- אם כולן הושגו → מציג הבאות בתור + גיל צפוי
- "הצג הכל ›" מנווט ל-GrowthTab

### פרוטוקול חום
- פרצטמול: 15mg/kg, כל 4 שעות
- איבופרופן: 10mg/kg, כל 6 שעות (מגיל 6 חודשים)

---

## GrowthTab
- ברירת מחדל: sub-tab **אבני דרך**
- `growthView` state מוחזק ב-App.jsx — מונע איפוס בעת reload
- לחיצה על שורה שלמה מסמנת/מבטלת

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

## AuthScreen — מצבים
`login` | `register` | `forgot` (resetPasswordForEmail)

---

## צבעים ועיצוב

```
background: #0d1117  card: #161b22  border: #30363d
female: #f472b6  male: #60a5fa  unknown: #a78bfa
success: #22c55e  warning: #f59e0b  danger: #ef4444
```
גופן: **Heebo** – RTL עברית

---

## הפעלה לוקאלית

```bash
cd "d:/backup/Sites In Build/med-tracker"
npm install
npm run dev       # http://localhost:5174
npm run build
```

### משתני סביבה נדרשים (`.env`)
```
VITE_VAPID_PUBLIC_KEY=...
```

---

## כללים חשובים

1. **Supabase = מקור האמת** — localStorage רק ל-`babycare_active` + `babycare_install_dismissed`
2. כל mutation → `await db.xxx()` → `await reload()`
3. RLS — המשתמש רואה רק נתוני המשפחות שלו
4. `themeColor` = `genderColor(activeBaby.gender)` — מועבר כ-prop לכל טאב
5. **onClick handlers**: תמיד `onClick={() => fn(arg)}` ולא `onClick={fn}` — אחרת React מעביר SyntheticEvent כ-argument
6. VaccinationsTab — `setTab('vaccinations')` בלבד
7. `BabyTab.jsx` — טאב מורחב קיים אך **לא מחובר ל-Supabase** (local state בלבד)
8. לבדוק RTL + מובייל אחרי כל שינוי CSS
