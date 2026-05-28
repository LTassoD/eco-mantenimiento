import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const roleRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN", "SUPERVISOR"],
  "/vehiculos": ["ADMIN", "SUPERVISOR"],
  "/checklist": ["DRIVER", "SUPERVISOR", "ADMIN"],
  "/maintenance": ["MECHANIC", "SUPERVISOR", "ADMIN"],
  "/reports": ["MANAGER", "ADMIN"],
  "/dashboard": ["ADMIN", "DRIVER", "SUPERVISOR", "MECHANIC", "MANAGER"],
};

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" || pathname === "/") {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url));
    return supabaseResponse;
  }

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = user.user_metadata?.role as string | undefined;

  for (const [prefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
