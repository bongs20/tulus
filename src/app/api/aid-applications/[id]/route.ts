import { NextResponse } from "next/server";
import { getAidApplication } from "@/lib/aid/application-service";
import { requireSessionRole } from "@/lib/aid/auth";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSessionRole([
    "ADMINISTRATOR",
    "PETUGAS_VERIFIKATOR",
    "KEPALA_BIDANG",
  ]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const application = await getAidApplication(id);
    return NextResponse.json(application);
  } catch (error) {
    return toAidErrorResponse(error, "Application not found.");
  }
}
