// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to public and login pages without authentication
    if (path.startsWith("/login") || path.startsWith("/publik")) {
      return NextResponse.next();
    }

    // Redirect authenticated users from login page to dashboard
    if (path === "/login" && token) {
      if (token.role === 'ADMINISTRATOR' || token.role === 'KEPALA_BIDANG') {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else if (token.role === 'PETUGAS_VERIFIKATOR') {
        return NextResponse.redirect(new URL("/antrian", req.url));
      }
    }

    // Protected routes and role-based access
    if (token) {
      if (path.startsWith("/dashboard") || path.startsWith("/laporan") || path.startsWith("/pengaturan")) {
        // ADMINISTRATOR and KEPALA_BIDANG can access these
        if (token.role === 'ADMINISTRATOR' || token.role === 'KEPALA_BIDANG') {
          return NextResponse.next();
        }
      }

      if (path.startsWith("/input-data") || path.startsWith("/antrian") || path.startsWith("/penyaluran")) {
        // All roles can access input-data and penyaluran.
        // PETUGAS_VERIFIKATOR also for antrian
        if (token.role === 'ADMINISTRATOR' || token.role === 'KEPALA_BIDANG' || token.role === 'PETUGAS_VERIFIKATOR') {
          return NextResponse.next();
        }
      }
      
      // Specific access for PETUGAS_VERIFIKATOR
      if (path.startsWith("/antrian") && token.role === 'PETUGAS_VERIFIKATOR') {
        return NextResponse.next();
      }

      // If user is authenticated but tries to access a page they don't have permission for
      // Or if the path is not explicitly handled above, redirect to a default safe page
      if (token.role === 'ADMINISTRATOR' || token.role === 'KEPALA_BIDANG') {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else if (token.role === 'PETUGAS_VERIFIKATOR') {
        return NextResponse.redirect(new URL("/antrian", req.url));
      }
    }

    // If no token and not on login/public page, redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - NextAuth API routes which are handled by the NextAuth handler itself
     * - public folder items
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Exclude API routes that are meant to be public or handled by NextAuth itself
    // But include routes starting with /api/auth as a catch-all if not handled by next-auth internally
  ],
};