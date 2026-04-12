// Developmental milestones based on Israel MOH / WHO guidelines
// expectedMonth: typical age in months when milestone is achieved
export const MILESTONES = [
  // Motor – gross
  { id: 'motor_head_control',  category: 'motor',    name: 'שולט בראש בשכיבה על הבטן',   expectedMonth: 2  },
  { id: 'motor_smile',         category: 'social',   name: 'חיוך חברתי',                  expectedMonth: 2  },
  { id: 'motor_follow_eyes',   category: 'cognitive',name: 'עוקב עם עיניים 180°',         expectedMonth: 3  },
  { id: 'motor_hands',         category: 'motor',    name: 'פותח ידיים, מביט בידיים',     expectedMonth: 3  },
  { id: 'motor_laugh',         category: 'social',   name: 'צוחק בקול',                   expectedMonth: 4  },
  { id: 'motor_roll_front',    category: 'motor',    name: 'מתהפך מגב לבטן',              expectedMonth: 5  },
  { id: 'motor_sit_support',   category: 'motor',    name: 'יושב בתמיכה',                 expectedMonth: 5  },
  { id: 'motor_reach',         category: 'motor',    name: 'מושיט יד לאחוז חפץ',          expectedMonth: 5  },
  { id: 'lang_babble',         category: 'language', name: 'מפטפט (ba-ba, ma-ma)',         expectedMonth: 6  },
  { id: 'motor_roll_back',     category: 'motor',    name: 'מתהפך מבטן לגב',              expectedMonth: 6  },
  { id: 'motor_sit_alone',     category: 'motor',    name: 'יושב לבד ללא תמיכה',          expectedMonth: 7  },
  { id: 'social_stranger',     category: 'social',   name: 'פחד מזרים',                   expectedMonth: 8  },
  { id: 'motor_crawl',         category: 'motor',    name: 'זוחל',                         expectedMonth: 8  },
  { id: 'motor_pincer',        category: 'motor',    name: 'אחיזת צבת (אגודל + אצבע)',    expectedMonth: 9  },
  { id: 'lang_mama_dada',      category: 'language', name: 'אומר "מאמא/דאדא" ספציפי',    expectedMonth: 10 },
  { id: 'motor_stand_support', category: 'motor',    name: 'עומד בתמיכה',                 expectedMonth: 10 },
  { id: 'motor_walk_support',  category: 'motor',    name: 'צועד בתמיכה (על קירות)',       expectedMonth: 11 },
  { id: 'motor_walk_alone',    category: 'motor',    name: 'צועד לבד',                     expectedMonth: 12 },
  { id: 'lang_first_word',     category: 'language', name: 'מילה ראשונה (מלבד מאמא/דאדא)', expectedMonth: 12 },
  { id: 'social_wave',         category: 'social',   name: 'מנופף שלום',                  expectedMonth: 12 },
  { id: 'cognitive_point',     category: 'cognitive',name: 'מצביע על חפצים',              expectedMonth: 12 },
  { id: 'motor_run',           category: 'motor',    name: 'רץ',                           expectedMonth: 15 },
  { id: 'lang_words_10',       category: 'language', name: '10 מילים בודדות',              expectedMonth: 18 },
  { id: 'motor_stairs',        category: 'motor',    name: 'עולה מדרגות',                  expectedMonth: 18 },
  { id: 'cognitive_pretend',   category: 'cognitive',name: 'משחק מדומה (מאכיל בובה)',      expectedMonth: 18 },
  { id: 'lang_sentences',      category: 'language', name: 'משפטים קצרים (2 מילים)',       expectedMonth: 24 },
  { id: 'social_parallel',     category: 'social',   name: 'משחק מקביל עם ילדים אחרים',   expectedMonth: 24 },
  { id: 'motor_jump',          category: 'motor',    name: 'קופץ ברגליים',                 expectedMonth: 24 },
  { id: 'lang_sentences_3',    category: 'language', name: 'משפטים של 3+ מילים',          expectedMonth: 30 },
  { id: 'social_cooperative',  category: 'social',   name: 'משחק שיתופי',                 expectedMonth: 36 },
]

export const CATEGORY_META = {
  motor:    { label: 'מוטורי',    icon: '🏃', color: '#f472b6' },
  language: { label: 'שפה',       icon: '💬', color: '#60a5fa' },
  social:   { label: 'חברתי-רגשי', icon: '😊', color: '#f59e0b' },
  cognitive:{ label: 'קוגניטיבי', icon: '🧠', color: '#a78bfa' },
}
