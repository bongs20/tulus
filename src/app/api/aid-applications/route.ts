import { NextRequest, NextResponse } from "next/server";
import { applyRateLimiter } from "@/lib/rate-limiter";
import {
  listAidApplications,
  submitAidApplicationWorkflow,
} from "@/lib/aid/application-service";
import { requireSessionRole } from "@/lib/aid/auth";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSessionRole([
    "ADMINISTRATOR",
    "PETUGAS_VERIFIKATOR",
    "KEPALA_BIDANG",
  ]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const data = await listAidApplications(req.nextUrl.searchParams);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const application = await submitAidApplicationWorkflow(body);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return toAidErrorResponse(error, "Failed to submit application.");
  }
}
