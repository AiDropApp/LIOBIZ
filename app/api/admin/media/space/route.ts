import { NextResponse } from "next/server";
import { adminGuard, filesIrGuard, handleFilesIrError } from "@/lib/admin-media-guard";
import { getSpaceUsage } from "@/lib/filesir/client";

export const runtime = "nodejs";

export async function GET() {
  const admin = await adminGuard();
  if (admin instanceof Response) return admin;
  const cfg = filesIrGuard();
  if (cfg) return cfg;

  try {
    const usage = await getSpaceUsage();
    return NextResponse.json({ ok: true, usage });
  } catch (error) {
    return handleFilesIrError(error);
  }
}
