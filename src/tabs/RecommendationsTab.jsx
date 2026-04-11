import { useState, useEffect } from 'react'
import { getAgeLabel, getCategoryFromBirthDate } from '../ageProfiles'

// Static MOH Israel guidelines by age category
const MOH_GUIDELINES = {
  baby: {
    title: 'הנחיות משרד הבריאות – תינוק (0-1)',
    sections: [
      {
        title: '🍼 תזונה',
        items: [
          'חלב אם הוא המזון המומלץ ביותר עד גיל 6 חודשים לפחות',
          'הכנסת מזון משלים מגיל 4-6 חודשים',
          'לא לתת דבש, מלח, סוכר לפני גיל שנה',
          'לא לתת חלב פרה כמשקה עיקרי לפני גיל שנה',
        ]
      },
      {
        title: '☀️ ויטמינים',
        items: [
          'ויטמין D: 400 יח"ב ביום מהיום הראשון לחיים',
          'ברזל: תוסף ברזל מגיל 4 חודשים לתינוקות יונקים',
          'ויטמין K: ניתן בלידה',
        ]
      },
      {
        title: '💉 חיסונים',
        items: [
          'לידה: Hep B, Vit K',
          'חודשיים: Pentaxim, Prevenar, Rotavirus',
          'ארבעה חודשים: Pentaxim, Prevenar, Rotavirus',
          'שישה חודשים: Pentaxim, Prevenar, Hep B',
          'שנה: MMR, Varicella, Hep A',
        ]
      },
      {
        title: '📏 בדיקות שגרתיות',
        items: [
          'בדיקות שמיעה ועיניים בלידה',
          'מעקב משקל/גובה: כל חודש בשנה הראשונה',
          'בדיקת דם (ברזל) בגיל 9-12 חודשים',
          'ביקורי טיפת חלב: חודש, 2, 4, 6, 9, 12 חודשים',
        ]
      }
    ]
  },
  toddler: {
    title: 'הנחיות משרד הבריאות – פעוט (1-3)',
    sections: [
      { title: '🍽️ תזונה', items: ['3 ארוחות + 2 ביניים ביום', 'חלב פרה עד 500 מ"ל ביום', 'ירקות ופירות בכל ארוחה', 'הגבל מיצים: לא יותר מ-120 מ"ל ביום'] },
      { title: '☀️ ויטמינים', items: ['ויטמין D: 400 יח"ב ביום עד גיל 2', 'ברזל: מזון עשיר בברזל כמו קטניות, בשר'] },
      { title: '💉 חיסונים', items: ['12-15 חודשים: MMR, Varicella, Hep A', '18 חודשים: DTaP booster', 'שנתיים: חיסון שפעת שנתי'] },
      { title: '📏 בדיקות', items: ['מעקב גדילה רבעוני', 'בדיקת ברזל בגיל שנה וחצי', 'בדיקת עיניים בגיל 3'] }
    ]
  },
  child: {
    title: 'הנחיות משרד הבריאות – ילד (3-12)',
    sections: [
      { title: '🍽️ תזונה', items: ['5 מנות ירק/פרי ביום', 'הגבל מזון מעובד וממותק', 'ארוחת בוקר חיונית לריכוז בלימודים', '1-2 מנות חלב ביום לסידן'] },
      { title: '☀️ ויטמינים', items: ['ויטמין D אם אין חשיפה מספקת לשמש', 'סידן: 800-1000 מ"ג ביום'] },
      { title: '💉 חיסונים', items: ['גיל 6: MMR booster, Varicella booster', 'גיל 7-8: DTaP, IPV booster', 'שנתי: חיסון שפעת'] },
      { title: '🏃 פעילות', items: ['60 דקות פעילות גופנית ביום', 'הגבל מסך: עד שעתיים ביום', 'שינה: 9-11 שעות בלילה'] }
    ]
  },
  teen: {
    title: 'הנחיות משרד הבריאות – מתבגר (12-18)',
    sections: [
      { title: '🍽️ תזונה', items: ['צריכה קלורית מוגברת בגלל גדילה', 'ברזל חשוב לבנות (מחזור)', 'סידן: 1300 מ"ג ביום – שיא בניית עצם', 'הימנעות ממשקאות אנרגיה'] },
      { title: '☀️ ויטמינים', items: ['ויטמין D אם אין חשיפה לשמש', 'חמצה פולית לבנות'] },
      { title: '💉 חיסונים', items: ['גיל 12: Tdap, HPV (2 מנות)', 'גיל 16-18: Meningococcal', 'שנתי: שפעת'] },
      { title: '🧠 בריאות נפשית', items: ['שינה: 8-10 שעות', 'סימני דיכאון/חרדה – פנה לרופא', 'פעילות גופנית: 60 דק׳ ביום'] }
    ]
  },
  adult: {
    title: 'הנחיות משרד הבריאות – מבוגר (18-65)',
    sections: [
      { title: '🍽️ תזונה', items: ['תזונה ים תיכונית מומלצת', 'הגבל מלח: פחות מ-5 גרם ביום', 'הגבל בשר מעובד', '8 כוסות מים ביום'] },
      { title: '🩺 בדיקות תקופתיות', items: ['בדיקת דם: כל שנה', 'לחץ דם: כל שנה', 'ממוגרפיה (נשים 50+): כל שנתיים', 'קולונוסקופיה (50+): כל 10 שנים'] },
      { title: '💉 חיסונים', items: ['שפעת: מדי שנה', 'קורונה: לפי המלצות עדכניות', 'Tdap: כל 10 שנים'] },
      { title: '🏃 פעילות', items: ['150 דק׳ פעילות אירובית בשבוע', 'אימון כוח: פעמיים בשבוע', 'הימנעות מישיבה ממושכת'] }
    ]
  },
  senior: {
    title: 'הנחיות משרד הבריאות – קשיש (65+)',
    sections: [
      { title: '💊 תרופות', items: ['עדכן רשימת תרופות אצל רופא כל שנה', 'שים לב לאינטראקציות בין תרופות', 'לא להפסיק תרופות בלי אישור רופא', 'אחסן תרופות בטמפרטורה מתאימה'] },
      { title: '🍽️ תזונה', items: ['חלבון מוגבר: 1.2-1.5 גרם/ק"ג', 'סידן: 1200 מ"ג ביום', 'ויטמין D: 800-1000 יח"ב', 'הגבל מלח ואלכוהול'] },
      { title: '🩺 בדיקות תקופתיות', items: ['לחץ דם: כל 3 חודשים', 'סוכר בדם: כל שנה', 'צפיפות עצם: כל שנתיים', 'בדיקת עיניים ושמיעה: כל שנה'] },
      { title: '🏃 פעילות', items: ['30 דק׳ הליכה ביום', 'תרגילי שיווי משקל למניעת נפילות', 'אימון כוח קל: פעמיים בשבוע'] }
    ]
  }
}

// Formula calculation per MOH Israel
function calcFormulaAmount(weightKg, ageMonths) {
  if (!weightKg || !ageMonths) return null
  // MOH formula: ~150-200ml/kg/day, divided by feeds
  const dailyMl = Math.round(weightKg * 150)
  const maxDailyMl = Math.round(weightKg * 200)
  const feedsPerDay = ageMonths < 1 ? 8 : ageMonths < 2 ? 7 : ageMonths < 4 ? 6 : 5
  const perFeed = Math.round(dailyMl / feedsPerDay)
  const maxPerFeed = Math.round(maxDailyMl / feedsPerDay)
  return { dailyMl, maxDailyMl, feedsPerDay, perFeed, maxPerFeed }
}

export default function RecommendationsTab({ profile, profileName, ageCategory }) {
  const [aiRec, setAiRec] = useState(null)
  const [loading, setLoading] = useState(false)
  const [asked, setAsked] = useState(false)
  const [weight, setWeight] = useState(profile?.weight || '')
  const [savingWeight, setSavingWeight] = useState(false)

  const guidelines = MOH_GUIDELINES[ageCategory] || MOH_GUIDELINES.adult
  const ageLabel = getAgeLabel(profile?.birthDate)
  const isBaby = ageCategory === 'baby' || ageCategory === 'toddler'

  const ageMonths = profile?.birthDate
    ? Math.floor((new Date() - new Date(profile.birthDate)) / (1000 * 60 * 60 * 24 * 30.44))
    : null

  const formula = isBaby && weight && ageMonths !== null
    ? calcFormulaAmount(parseFloat(weight), ageMonths)
    : null

  const askClaude = async () => {
    setLoading(true)
    setAsked(true)
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 600,
          system: 'אתה עוזר רפואי ישראלי. ענה בעברית בצורה תמציתית. הוסף תמיד הערה שזה לא מחליף ייעוץ רופא.',
          messages: [{
            role: 'user',
            content: `תן 4-5 המלצות בריאות ספציפיות ומעשיות לילד/מבוגר בגיל: ${ageLabel || ageCategory}.
קטגוריה: ${guidelines.title}.
${weight ? `משקל: ${weight} ק"ג.` : ''}
פורמט: נקודות קצרות בעברית. ללא הקדמה.`
          }]
        })
      })
      const data = await resp.json()
      setAiRec(data.content?.[0]?.text || 'לא הצלחתי לטעון המלצות.')
    } catch (e) {
      setAiRec('שגיאה בטעינת המלצות. נסה שנית.')
    }
    setLoading(false)
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 16, lineHeight: 1.5 }}>
        המלצות עבור <span style={{ color: '#58a6ff', fontWeight: 700 }}>{profileName}</span>
        {ageLabel ? ` · ${ageLabel}` : ''}
      </p>

      {/* Weight input for babies */}
      {isBaby && (
        <div style={{ background: '#161b22', border: '1px solid #f472b633', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f9a8d4', marginBottom: 10 }}>⚖️ משקל לחישוב כמות האכלה</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number" value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="לדוג׳ 5.2"
              step="0.1" min="1" max="15"
              style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', fontSize: 16, fontFamily: 'Heebo', direction: 'ltr', textAlign: 'center' }}
            />
            <span style={{ fontSize: 13, color: '#8b949e' }}>ק"ג</span>
          </div>

          {formula && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#f472b615', border: '1px solid #f472b633', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>📊 כמות מומלצת לפי הנחיות משרד הבריאות</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'כמות יומית', value: `${formula.dailyMl}-${formula.maxDailyMl} מ"ל` },
                    { label: 'מנות ביום', value: `${formula.feedsPerDay} האכלות` },
                    { label: 'כמות למנה', value: `${formula.perFeed}-${formula.maxPerFeed} מ"ל` },
                    { label: 'בסיס חישוב', value: `150-200 מ"ל/ק"ג` },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#21262d', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f9a8d4', marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>* חלב אם: חישוב לפי ביקוש, לא כמות קבועה</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Static MOH guidelines */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🏥</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{guidelines.title}</p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>מקור: הנחיות משרד הבריאות ישראל</p>
          </div>
        </div>
        {guidelines.sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#58a6ff', marginBottom: 6 }}>{sec.title}</p>
            {sec.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                <span style={{ color: '#388bfd', fontSize: 12, flexShrink: 0, marginTop: 1 }}>•</span>
                <p style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* AI recommendations */}
      <div style={{ background: '#161b22', border: '1px solid #a78bfa33', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>המלצות מותאמות אישית</p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>מופעל על ידי Claude AI</p>
          </div>
        </div>

        {!asked && (
          <button onClick={askClaude} style={{
            width: '100%', background: '#a78bfa22', color: '#a78bfa',
            border: '1px solid #a78bfa44', borderRadius: 8, padding: '10px',
            fontSize: 13, fontWeight: 700, fontFamily: 'Heebo', cursor: 'pointer'
          }}>
            ✨ קבל המלצות מותאמות לגיל
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#a78bfa' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: 13 }}>טוען המלצות...</p>
          </div>
        )}

        {aiRec && !loading && (
          <div>
            <div style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiRec}</div>
            <button onClick={askClaude} style={{
              marginTop: 12, background: 'none', color: '#6b7280',
              border: '1px solid #30363d', borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontFamily: 'Heebo', cursor: 'pointer'
            }}>🔄 רענן</button>
          </div>
        )}
      </div>
    </div>
  )
}
