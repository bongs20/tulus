import { NextResponse } from "next/server";
import { requireSessionRole } from "@/lib/aid/auth";
import { getAidDashboardSummary } from "@/lib/aid/application-service";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSessionRole([
    "ADMINISTRATOR",
    "PETUGAS_VERIFIKATOR",
    "KEPALA_BIDANG",
  ]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const summary = await getAidDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return toAidErrorResponse(error, "Failed to fetch aid monitoring summary.");
  }
}
