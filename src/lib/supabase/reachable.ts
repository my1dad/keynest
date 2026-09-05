const FAIL_TTL_MS = 30_000;

let cached: { ok: boolean; until: number } | null = null;
let inflight: Promise<boolean> | null = null;

/** Fast check so a dead/missing project does not trigger supabase-js retries. */
export async function isSupabaseReachable(): Promise<boolean> {
  if (cached && cached.until > Date.now()) return cached.ok;
  if (inflight) return inflight;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) {
    cached = { ok: false, until: Date.now() + FAIL_TTL_MS };
    return false;
  }

  inflight = fetch(`${url}/auth/v1/health`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
  })
    .then((res) => {
      const ok = res.ok || (res.status >= 400 && res.status < 500);
      cached = {
        ok,
        until: Date.now() + (ok ? 60_000 : FAIL_TTL_MS),
      };
      return ok;
    })
    .catch(() => {
      cached = { ok: false, until: Date.now() + FAIL_TTL_MS };
      return false;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
