import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@vibe-planning/shared';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return mapDbRowToUser(data);
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const normalizedPhone = normalizePhone(phone);
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('phone', normalizedPhone)
    .single();

  if (error || !data) return null;
  return mapDbRowToUser(data);
}

export async function createUser(params: { email: string; phone?: string }): Promise<User> {
  const userId = `user_${generateId()}`;
  const now = new Date().toISOString();

  const userRecord = {
    id: userId,
    email: params.email.toLowerCase(),
    phone: params.phone ? normalizePhone(params.phone) : null,
    timezone: 'America/Chicago',
    preferences: {},
    created_at: now,
    last_active: now,
  };

  const { data, error } = await getSupabase().from('users').insert(userRecord).select().single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return mapDbRowToUser(data);
}

export async function updateUserLastActive(userId: string): Promise<void> {
  await getSupabase()
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId);
}

export async function linkPhoneToUser(userId: string, phone: string): Promise<void> {
  await getSupabase().from('users').update({ phone: normalizePhone(phone) }).eq('id', userId);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function mapDbRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    phone: row.phone as string | undefined,
    timezone: row.timezone as string,
    preferences: (row.preferences as User['preferences']) ?? {},
    createdAt: row.created_at as string,
    lastActive: row.last_active as string,
  };
}
