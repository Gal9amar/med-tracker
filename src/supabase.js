import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lbnbkrdworugatkxawaj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibmJrcmR3b3J1Z2F0a3hhd2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODA5NzksImV4cCI6MjA5MTU1Njk3OX0.pPk4dqO7Sb53398ZsXnlcnjY88LoBu6XyrePJTGhkG0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
})
