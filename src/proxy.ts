import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

const pathRoles: Record<string, readonly Role[]> = {
  "/dashboard": ["ADMINISTRATOR", "KEPALA_BIDANG", "PETUGAS_VERIFIKATOR"],
  "/antrian": ["ADMINISTRATOR", "PETUGAS_VERIFIKATOR"],
  "/penyaluran": ["ADMINISTRATOR", "PETUGAS_VERIFIKATOR"],
  "/laporan": ["ADMINISTRATOR", "KEPALA_BIDANG"],
  "/pengaturan": ["ADMINISTRATOR"],
};

const protectedPrefixes = Object.keys(pathRoles);

function getDefaultRouteForRole(role?: string | null) {
  if (role === "PETUGAS_VERIFIKATOR") {
    return "/antrian";
  }

  return "/dashboard";
}

function getRequestOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");

  if (!host) {
    return req.nextUrl.origin;
  }

  return `${forwardedProto ?? req.nextUrl.protocol.replace(":", "")}://${host}`;
}

function buildAbsoluteUrl(req: NextRequest, path: string) {
  return new URL(path, getRequestOrigin(req));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret });
  const matchedPrefix = protectedPrefixes.find((prefix) => pathname.startsWith(prefix));

  if (pathname === "/login" && token) {
    return NextResponse.redirect(buildAbsoluteUrl(req, getDefaultRouteForRole(token.role)));
  }

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = buildAbsoluteUrl(req, "/login");
    const callbackUrl = `${pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = pathRoles[matchedPrefix as keyof typeof pathRoles];
  if (!allowedRoles.includes(token.role as Role)) {
    return NextResponse.redirect(buildAbsoluteUrl(req, getDefaultRouteForRole(token.role)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/antrian/:path*",
    "/penyaluran/:path*",
    "/laporan/:path*",
    "/pengaturan/:path*",
  ],
};
