/**
 * db.js – Data access layer using Supabase
 * All functions return { data, error }
 */
import { supabase } from './supabase'

function _extractStoragePathFromPublicUrl(publicUrl, bucket) {
  if (!publicUrl || typeof publicUrl !== 'string') return null
  // Expected: .../storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  const raw = publicUrl.slice(idx + marker.length)
  try {
    return decodeURIComponent(raw.split('?')[0])
  } catch {
    return raw.split('?')[0]
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const getSession = () => supabase.auth.getSession()
export const getUser = () => supabase.auth.getUser()
export const signOut = () => supabase.auth.signOut()

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

export async function upsertMember(userId, email, fullName) {
  return supabase
    .from('members')
    .upsert({ id: userId, email, full_name: fullName }, { onConflict: 'id' })
    .select().single()
}

export async function getMember(userId) {
  return supabase.from('members').select('*').eq('id', userId).maybeSingle()
}

// ─── FAMILY ──────────────────────────────────────────────────────────────────

export async function createFamily(userId, displayName) {
  // 1. Create family — use service-role workaround via RPC to get back the id
  // INSERT without .select() to avoid RLS blocking SELECT before member row exists
  const familyId = crypto.randomUUID()
  const { error: fe } = await supabase
    .from('families')
    .insert({ id: familyId, name: 'המשפחה שלנו', created_by: userId })
  if (fe) return { error: fe }

  // 2. Add creator as admin member
  const { error: me } = await supabase
    .from('family_members')
    .insert({ family_id: familyId, member_id: userId, role: 'admin', display_name: displayName })
  if (me) return { error: me }

  // 3. Now SELECT is allowed (user is a family member)
  const { data: family, error: fe2 } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()
  if (fe2) return { error: fe2 }

  return { data: family }
}

export async function getUserFamily(userId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, role, families(*)')
    .eq('member_id', userId)
    .maybeSingle()
  return { data, error }
}

// ─── INVITE CODES ────────────────────────────────────────────────────────────

export async function createInviteCode(familyId, userId) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      family_id: familyId,
      code,
      created_by: userId,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    })
    .select().single()
  return { data, error }
}

export async function joinByCode(code, userId, displayName) {
  // Find valid invite
  const { data: invite, error: ie } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (ie || !invite) return { error: { message: 'קוד לא תקין או פג תוקף' } }

  // Check not already a member
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', invite.family_id)
    .eq('member_id', userId)
    .single()

  if (existing) return { error: { message: 'כבר חבר במשפחה זו' } }

  // Join family
  const { error: me } = await supabase
    .from('family_members')
    .insert({ family_id: invite.family_id, member_id: userId, role: 'parent', display_name: displayName })
  if (me) return { error: me }

  // Mark code as used
  await supabase
    .from('invite_codes')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return { data: { family_id: invite.family_id } }
}

// ─── BABIES ──────────────────────────────────────────────────────────────────

export async function getBabies(familyId) {
  return supabase.from('babies').select('*').eq('family_id', familyId).order('created_at')
}

export async function addBaby(familyId, baby) {
  return supabase.from('babies').insert({ ...baby, family_id: familyId }).select().single()
}

export async function updateBaby(id, updates) {
  return supabase.from('babies').update(updates).eq('id', id).select().single()
}

export async function deleteBaby(id) {
  return supabase.from('babies').delete().eq('id', id)
}

// ─── BABY LOG ─────────────────────────────────────────────────────────────────

export async function getBabyLog(familyId, babyId, date) {
  let q = supabase.from('baby_log').select('*').eq('family_id', familyId).eq('baby_id', babyId)
  if (date) q = q.eq('date', date)
  return q.order('created_at')
}

export async function addLog(familyId, babyId, entry) {
  return supabase.from('baby_log')
    .insert({ ...entry, family_id: familyId, baby_id: babyId })
    .select().single()
}

export async function deleteLog(id) {
  return supabase.from('baby_log').delete().eq('id', id)
}

// ─── MEDS ────────────────────────────────────────────────────────────────────

export async function getMeds(familyId, babyId) {
  return supabase.from('meds').select('*').eq('family_id', familyId).eq('baby_id', babyId)
}

export async function addMed(familyId, babyId, med) {
  return supabase.from('meds').insert({ ...med, family_id: familyId, baby_id: babyId }).select().single()
}

export async function updateMed(id, updates) {
  return supabase.from('meds').update(updates).eq('id', id).select().single()
}

export async function deleteMed(id) {
  return supabase.from('meds').delete().eq('id', id)
}

// ─── MED LOG ─────────────────────────────────────────────────────────────────

export async function getMedLog(familyId, babyId, date) {
  let q = supabase.from('med_log').select('*').eq('family_id', familyId).eq('baby_id', babyId)
  if (date) q = q.eq('date', date)
  return q
}

export async function addMedLog(familyId, babyId, entry) {
  return supabase.from('med_log').insert({ ...entry, family_id: familyId, baby_id: babyId }).select().single()
}

export async function deleteMedLog(id) {
  return supabase.from('med_log').delete().eq('id', id)
}

// ─── PRESCRIPTIONS ───────────────────────────────────────────────────────────

export async function getPrescriptions(familyId, babyId) {
  return supabase.from('prescriptions').select('*').eq('family_id', familyId).eq('baby_id', babyId).order('created_at', { ascending: false })
}

export async function addPrescription(familyId, babyId, rx) {
  return supabase.from('prescriptions').insert({ ...rx, family_id: familyId, baby_id: babyId }).select().single()
}

export async function deletePrescription(id) {
  return supabase.from('prescriptions').delete().eq('id', id)
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────

export async function getInventory(familyId) {
  return supabase.from('inventory').select('*').eq('family_id', familyId).order('name')
}

export async function addInventoryItem(familyId, item) {
  return supabase.from('inventory').insert({ ...item, family_id: familyId }).select().single()
}

export async function updateInventoryItem(id, updates) {
  return supabase.from('inventory').update(updates).eq('id', id).select().single()
}

export async function deleteInventoryItem(id) {
  return supabase.from('inventory').delete().eq('id', id)
}

// ─── VACCINATIONS ────────────────────────────────────────────────────────────

export async function getVaccinations(familyId, babyId) {
  return supabase.from('vaccinations').select('*').eq('family_id', familyId).eq('baby_id', babyId).order('scheduled_date')
}

export async function addVaccinations(familyId, babyId, vaccines) {
  const rows = vaccines.map(v => ({ ...v, family_id: familyId, baby_id: babyId }))
  return supabase.from('vaccinations').insert(rows).select()
}

export async function updateVaccination(id, updates) {
  return supabase.from('vaccinations').update(updates).eq('id', id).select().single()
}

// ─── GROWTH LOG ──────────────────────────────────────────────────────────────

export async function getGrowthLog(familyId, babyId) {
  return supabase.from('growth_log').select('*').eq('family_id', familyId).eq('baby_id', babyId).order('date')
}

export async function addGrowthEntry(familyId, babyId, entry) {
  return supabase.from('growth_log').insert({ ...entry, family_id: familyId, baby_id: babyId }).select().single()
}

export async function deleteGrowthEntry(id) {
  return supabase.from('growth_log').delete().eq('id', id)
}

// ─── USER SETTINGS ───────────────────────────────────────────────────────────
// Stores per-user key→value settings (e.g. notification preferences).
// Table: user_settings (user_id text PK, key text, value jsonb)
// Run once in Supabase SQL editor:
//   CREATE TABLE IF NOT EXISTS user_settings (
//     id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//     key        text NOT NULL,
//     value      jsonb,
//     updated_at timestamptz DEFAULT now(),
//     UNIQUE(user_id, key)
//   );
//   ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "users manage own settings"
//     ON user_settings FOR ALL USING (auth.uid() = user_id);

export async function getUserSetting(userId, key) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()
  return { data: data?.value ?? null, error }
}

export async function setUserSetting(userId, key, value) {
  return supabase
    .from('user_settings')
    .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,key' })
    .select().single()
}

// ─── DELETE ACCOUNT ──────────────────────────────────────────────────────────
// Deletes ALL family data for the user, then signs out.
// The auth user record itself is deleted via a Supabase Edge Function or
// cascades via ON DELETE CASCADE on family_members → families.
// We delete what RLS lets us delete directly from the client.

export async function deleteAllFamilyData(familyId, userId) {
  // Delete baby photos from Storage using an Edge Function (service-role),
  // so it works even when Storage RLS blocks client-side delete/list.
  await supabase.functions.invoke('delete-family-photos', { body: { familyId } }).catch(() => undefined)

  // Delete all family-scoped data in dependency order
  const familyTables = [
    'milestones', 'growth_log', 'vaccinations',
    'prescriptions', 'med_log', 'meds',
    'inventory', 'baby_log', 'babies',
    'invite_codes', 'family_members',
  ]
  for (const table of familyTables) {
    await supabase.from(table).delete().eq('family_id', familyId)
  }
  // Delete user-scoped settings
  await supabase.from('user_settings').delete().eq('user_id', userId)
  // Delete the family record itself
  await supabase.from('families').delete().eq('id', familyId)
  // Delete member record (cascade will handle auth.users if configured)
  await supabase.from('members').delete().eq('id', userId)
  // Sign out
  await supabase.auth.signOut()
}

// ─── MILESTONES ──────────────────────────────────────────────────────────────

export async function getMilestones(familyId, babyId) {
  return supabase.from('milestones').select('*').eq('family_id', familyId).eq('baby_id', babyId)
}

export async function toggleMilestone(familyId, babyId, milestoneId, achieved) {
  if (achieved) {
    return supabase.from('milestones')
      .upsert({ family_id: familyId, baby_id: babyId, milestone_id: milestoneId, achieved_date: new Date().toISOString().slice(0, 10) },
        { onConflict: 'baby_id,milestone_id' })
      .select().single()
  } else {
    return supabase.from('milestones')
      .delete()
      .eq('baby_id', babyId)
      .eq('milestone_id', milestoneId)
  }
}
