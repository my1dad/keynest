import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseReachable } from "@/lib/supabase/reachable";
import type { Profile } from "@/lib/auth-types";
import { AUTH } from "@/lib/auth-routes";

export type { AppRole, AccountType, Profile, Organization, Membership } from "@/lib/auth-types";
export { roleLabel } from "@/lib/auth-types";

export async function getUser() {
  if (!(await isSupabaseReachable())) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("kn_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data as Profile | null;
}

export async function isAuthenticated() {
  return Boolean(await getUser());
}

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) {
    redirect(`${AUTH.signIn}?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export async function requireAdmin() {
  return requireUser("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getMemberships() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("kn_memberships")
    .select("*, kn_organizations(*)")
    .eq("user_id", user.id);

  return data ?? [];
}
