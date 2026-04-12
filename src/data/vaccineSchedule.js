// Israel Ministry of Health vaccination schedule (2024)
// ageMonths: age in months when vaccine should be given (0 = birth)
export const ISRAEL_VACCINE_SCHEDULE = [
  // At birth
  { id: 'hepb_0',       name: 'צהבת B – מנה 1',         nameEn: 'Hepatitis B #1',     ageMonths: 0,  ageLabel: 'לידה',           group: 'צהבת B' },

  // 2 months
  { id: 'dtap_ipv_hib_1', name: 'חמישוני – מנה 1',       nameEn: 'Pentaxim #1',        ageMonths: 2,  ageLabel: 'חודשיים',         group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'pcv_1',          name: 'פנאומוקוק – מנה 1',     nameEn: 'Prevenar 13 #1',     ageMonths: 2,  ageLabel: 'חודשיים',         group: 'פנאומוקוק' },
  { id: 'rv_1',           name: 'רוטה ויירוס – מנה 1',   nameEn: 'RotaTeq/Rotarix #1', ageMonths: 2,  ageLabel: 'חודשיים',         group: 'רוטה ויירוס' },
  { id: 'hepb_1',         name: 'צהבת B – מנה 2',        nameEn: 'Hepatitis B #2',     ageMonths: 2,  ageLabel: 'חודשיים',         group: 'צהבת B' },

  // 4 months
  { id: 'dtap_ipv_hib_2', name: 'חמישוני – מנה 2',       nameEn: 'Pentaxim #2',        ageMonths: 4,  ageLabel: 'ארבעה חודשים',    group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'pcv_2',          name: 'פנאומוקוק – מנה 2',     nameEn: 'Prevenar 13 #2',     ageMonths: 4,  ageLabel: 'ארבעה חודשים',    group: 'פנאומוקוק' },
  { id: 'rv_2',           name: 'רוטה ויירוס – מנה 2',   nameEn: 'RotaTeq #2',         ageMonths: 4,  ageLabel: 'ארבעה חודשים',    group: 'רוטה ויירוס' },

  // 6 months
  { id: 'dtap_ipv_hib_3', name: 'חמישוני – מנה 3',       nameEn: 'Pentaxim #3',        ageMonths: 6,  ageLabel: 'שישה חודשים',     group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'hepb_2',         name: 'צהבת B – מנה 3',        nameEn: 'Hepatitis B #3',     ageMonths: 6,  ageLabel: 'שישה חודשים',     group: 'צהבת B' },
  { id: 'flu_1',          name: 'שפעת – מנה 1',          nameEn: 'Influenza #1',       ageMonths: 6,  ageLabel: 'שישה חודשים (עונתי)', group: 'שפעת' },
  { id: 'rv_3',           name: 'רוטה ויירוס – מנה 3',   nameEn: 'RotaTeq #3',         ageMonths: 6,  ageLabel: 'שישה חודשים',     group: 'רוטה ויירוס' },

  // 12 months
  { id: 'mmr_1',          name: 'חצבת-אדמת-חזרת – מנה 1', nameEn: 'MMR #1',            ageMonths: 12, ageLabel: 'שנה',             group: 'חצבת-אדמת-חזרת (MMR)' },
  { id: 'var_1',          name: 'אבעבועות רוח – מנה 1',  nameEn: 'Varicella #1',       ageMonths: 12, ageLabel: 'שנה',             group: 'אבעבועות רוח' },
  { id: 'hepa_1',         name: 'צהבת A – מנה 1',        nameEn: 'Hepatitis A #1',     ageMonths: 12, ageLabel: 'שנה',             group: 'צהבת A' },
  { id: 'pcv_3',          name: 'פנאומוקוק – מנה 3',     nameEn: 'Prevenar 13 #3',     ageMonths: 12, ageLabel: 'שנה',             group: 'פנאומוקוק' },
  { id: 'menb_1',         name: 'מנינגוקוק B – מנה 1',   nameEn: 'Bexsero #1',         ageMonths: 12, ageLabel: 'שנה',             group: 'מנינגוקוק B' },

  // 18 months
  { id: 'hepa_2',         name: 'צהבת A – מנה 2',        nameEn: 'Hepatitis A #2',     ageMonths: 18, ageLabel: '18 חודשים',       group: 'צהבת A' },
  { id: 'menb_2',         name: 'מנינגוקוק B – מנה 2',   nameEn: 'Bexsero #2',         ageMonths: 18, ageLabel: '18 חודשים',       group: 'מנינגוקוק B' },
  { id: 'dtap_ipv_hib_4', name: 'חמישוני – מנה 4 (חיזוק)', nameEn: 'Pentaxim #4',      ageMonths: 18, ageLabel: '18 חודשים',       group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'mmr_2',          name: 'חצבת-אדמת-חזרת – מנה 2', nameEn: 'MMR #2',            ageMonths: 18, ageLabel: '18 חודשים',       group: 'חצבת-אדמת-חזרת (MMR)' },
  { id: 'var_2',          name: 'אבעבועות רוח – מנה 2',  nameEn: 'Varicella #2',       ageMonths: 18, ageLabel: '18 חודשים',       group: 'אבעבועות רוח' },

  // 6 years (72 months)
  { id: 'dtap_ipv_5',     name: 'רביעוני – כיתה א',     nameEn: 'Td-IPV booster',     ageMonths: 72, ageLabel: 'כיתה א (6 שנים)', group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'mmr_3',          name: 'חצבת-אדמת – כיתה א',   nameEn: 'MMR booster',        ageMonths: 72, ageLabel: 'כיתה א (6 שנים)', group: 'חצבת-אדמת-חזרת (MMR)' },

  // 13 years (156 months)
  { id: 'tdap_156',       name: 'dTap – כיתה ז',        nameEn: 'Tdap booster',       ageMonths: 156, ageLabel: 'כיתה ז (13 שנים)', group: 'חמישוני (DTPa-IPV-Hib)' },
  { id: 'hpv_1',         name: 'HPV – מנה 1',           nameEn: 'Gardasil #1',        ageMonths: 156, ageLabel: 'כיתה ז (13 שנים)', group: 'HPV' },
  { id: 'hpv_2',         name: 'HPV – מנה 2',           nameEn: 'Gardasil #2',        ageMonths: 162, ageLabel: 'כיתה ז + 6 חודשים', group: 'HPV' },
  { id: 'menc_156',      name: 'מנינגוקוק C',            nameEn: 'Meningococcal C',    ageMonths: 156, ageLabel: 'כיתה ז (13 שנים)', group: 'מנינגוקוק' },
]

// Tipat Chalav visit schedule (months)
export const TIPAT_CHALAV_VISITS = [
  { ageMonths: 0.5,  label: 'שבועיים',      description: 'בדיקת יילוד ראשונה' },
  { ageMonths: 1,    label: 'חודש',          description: 'בדיקת חודש' },
  { ageMonths: 2,    label: 'חודשיים',       description: 'בדיקה + חיסונים' },
  { ageMonths: 4,    label: 'ארבעה חודשים',  description: 'בדיקה + חיסונים' },
  { ageMonths: 6,    label: 'שישה חודשים',   description: 'בדיקה + חיסונים' },
  { ageMonths: 9,    label: 'תשעה חודשים',   description: 'בדיקת התפתחות' },
  { ageMonths: 12,   label: 'שנה',           description: 'בדיקה + חיסונים' },
  { ageMonths: 15,   label: '15 חודשים',     description: 'בדיקת התפתחות' },
  { ageMonths: 18,   label: '18 חודשים',     description: 'בדיקה + חיסונים' },
  { ageMonths: 24,   label: 'שנתיים',        description: 'בדיקה שנתית' },
]

// Generate vaccination entries for a baby based on birthDate
export function generateVaccinations(babyId, birthDate) {
  const birth = new Date(birthDate)
  return ISRAEL_VACCINE_SCHEDULE.map(v => {
    const scheduled = new Date(birth)
    scheduled.setDate(scheduled.getDate() + Math.round(v.ageMonths * 30.44))
    const scheduledDate = scheduled.toISOString().slice(0, 10)
    const now = new Date()
    const isPast = scheduled < now
    return {
      id: `${babyId}_${v.id}`,
      babyId,
      vaccineId: v.id,
      name: v.name,
      group: v.group,
      ageLabel: v.ageLabel,
      scheduledDate,
      actualDate: null,
      status: isPast ? 'overdue' : 'pending',
      clinic: '',
      doctor: '',
      batchNumber: '',
      sideEffects: '',
    }
  })
}
