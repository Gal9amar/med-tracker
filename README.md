# 💊 MedTracker

אפליקציית מעקב תרופות יומי – בנויה עם React + Vite, מתארחת על Netlify.

> שים לב: בפועל זה פרויקט **BabyCare** (מעקב תינוקות + Supabase). ה-README כאן עודכן חלקית בלבד.

## פיצ'רים
- 📅 מעקב תרופות יומי לפי זמן (בוקר/צהריים/ערב/לילה)
- 💊 ניהול תרופות עם הנחיות שימוש ותאריך תפוגה
- 🏠 מלאי תרופות הבית עם התראות תוקף
- 📷 סריקת ברקוד (BarcodeDetector API)
- 📊 היסטוריה וגרף ציות שבועי
- 💾 שמירה מקומית (localStorage) – ללא שרת

## התקנה

```bash
npm install
npm run dev
```

## Deploy ל-Netlify

חבר את הריפו ל-Netlify – הכל מוגדר אוטומטית דרך `netlify.toml`.

## Web Push (התראות גם כשהאתר סגור)

כדי לקבל התראות כשהאתר סגור צריך **Web Push אמיתי** (Service Worker + Push Subscription + שליחה מהשרת).

### 1) DB (Supabase SQL)

הרץ ב־Supabase SQL Editor את הקובץ `supabase/sql/push.sql` (יוצר `push_subscriptions` + `push_sent` + policies).

### 2) VAPID Keys

צור VAPID keys (פעם אחת) ושמור:
- **Public key** ב־Netlify env כ־`VITE_VAPID_PUBLIC_KEY`
- **Public + Private + Subject** ב־Supabase Edge Function Secrets כ־`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

דוגמה ליצירה (node):

```bash
npx web-push generate-vapid-keys
```

### 3) Edge Functions

הפונקציות נמצאות ב:
- `supabase/functions/send-push` — שליחת הודעה למשתמש
- `supabase/functions/cron-notifications` — שולחת אוטומטית לפי נתונים (מיועדת ל־Schedule כל 5 דקות)

פריסה (דרך Supabase CLI):

```bash
supabase functions deploy send-push
supabase functions deploy cron-notifications
```

### 4) Schedule

ב־Supabase Dashboard → **Edge Functions → Schedules** צור Schedule ל־`cron-notifications` (למשל כל 5 דקות).

