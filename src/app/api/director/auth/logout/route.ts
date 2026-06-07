import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
