import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    commit_hint: "7250475-runtime-fix",
    build_time: new Date().toISOString(),
    env_state: {
      IONOS_IMAP_HOST_set: !!process.env.IONOS_IMAP_HOST,
      IONOS_IMAP_USER_set: !!process.env.IONOS_IMAP_USER,
      IONOS_IMAP_PASSWORD_set: !!process.env.IONOS_IMAP_PASSWORD,
      SCRAPLING_SECRET_set: !!process.env.SCRAPLING_SECRET,
      INSEE_API_KEY_set: !!process.env.INSEE_API_KEY,
    },
  });
}
