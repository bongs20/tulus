import { NextRequest, NextResponse } from "next/server";
import { requireSessionRole } from "@/lib/aid/auth";
import { toAidErrorResponse } from "@/lib/aid/errors";
import { getAidMonitoringReport } from "@/lib/aid/reporting-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSessionRole([
    "ADMINISTRATOR",
    "KEPALA_BIDANG",
  ]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const report = await getAidMonitoringReport(req.nextUrl.searchParams);
    return NextResponse.json(report);
  } catch (error) {
    return toAidErrorResponse(error, "Failed to generate aid monitoring report.");
  }
}
