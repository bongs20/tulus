import { NextResponse } from "next/server";
import { requireSessionRole } from "@/lib/aid/auth";
import { validateAidApplication } from "@/lib/aid/application-service";
import { toAidErrorResponse } from "@/lib/aid/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSessionRole(["ADMINISTRATOR", "PETUGAS_VERIFIKATOR"]);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const application = await validateAidApplication(id);
    return NextResponse.json(application);
  } catch (error) {
    return toAidErrorResponse(error, "Failed to validate application.");
  }
}
