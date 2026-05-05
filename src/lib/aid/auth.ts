import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSessionRole(allowedRoles: readonly Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized.",
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      ok: false as const,
      status: 403,
      message: "Forbidden.",
    };
  }

  return {
    ok: true as const,
    user: session.user,
  };
}
