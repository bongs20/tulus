import { NextRequest, NextResponse } from "next/server";
import { requireSessionRole } from "@/lib/aid/auth";
import { distributeAid } from "@/lib/aid/application-service";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSessionRole(["ADMINISTRATOR", "PETUGAS_VERIFIKATOR"]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const application = await distributeAid({
      applicationId: id,
      payload: body,
      actorId: auth.user.id,
      actorRole: auth.user.role,
    });
    return NextResponse.json(application);
  } catch (error) {
    return toAidErrorResponse(error, "Failed to distribute aid.");
  }
}
