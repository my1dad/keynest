import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  return NextResponse.json({ authenticated: Boolean(user) });
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase unreachable — cookies still cleared on the next request.
  }
  return NextResponse.json({ ok: true });
}
