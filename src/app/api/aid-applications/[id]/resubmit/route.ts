import { NextRequest, NextResponse } from "next/server";
import { applyRateLimiter } from "@/lib/rate-limiter";
import {
  resubmitAidApplicationWorkflow,
} from "@/lib/aid/application-service";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const application = await resubmitAidApplicationWorkflow(id, body);
    return NextResponse.json(application);
  } catch (error) {
    return toAidErrorResponse(error, "Failed to resubmit application.");
  }
}
