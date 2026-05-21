import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({request});

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({request});
          cookiesToSet.forEach(({name, value, options}) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: {user},
  } = await supabase.auth.getUser();

  const {pathname} = request.nextUrl;

  // ✅ Allow access to public auth pages (unauthenticated)
  if (pathname === "/auth/login" || pathname === "/auth/sign-up") {
    return supabaseResponse;
  }

  // ✅ Allow access to callback and verification pages
  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/verify")) {
    return supabaseResponse;
  }

  // Not logged in — redirect to login for protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Logged in user
  if (user) {
    // ✅ Fetch user profile to check onboarding status
    const {data: profile, error: profileError} = await supabase
      .from("profiles")
      .select("role, is_suspended, full_name, phone, employment_status")
      .eq("id", user.id)
      .single();

    // If no profile or error, treat as new user needing onboarding
    const isNewUser = profileError || !profile;

    // Check onboarding completion (Stage 1 & 2 required)
    const hasCompletedOnboarding =
      !isNewUser && profile?.full_name && profile?.phone && profile?.employment_status;

    const isSuspended = profile?.is_suspended || false;
    const role = profile?.role;

    // ✅ SUSPENSION CHECK - Allow access to suspended page only
    if (isSuspended) {
      if (pathname !== "/dashboard/suspended") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/suspended";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // In your middleware.ts
    if (
      pathname === "/auth/login" ||
      pathname === "/auth/sign-up" ||
      pathname === "/auth/setup" || // ✅ Add this
      pathname === "/auth/account-setup" // ✅ Add this
    ) {
      return supabaseResponse;
    }

    // ✅ ONBOARDING CHECK - Redirect to setup if onboarding not complete
    if (
      !hasCompletedOnboarding &&
      !pathname.startsWith("/auth/setup") &&
      !pathname.startsWith("/auth/account-setup") &&
      profile?.role !== "admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/setup";
      return NextResponse.redirect(url);
    }

    // ✅ Allow access to setup/account-setup pages for incomplete users
    if (
      !hasCompletedOnboarding &&
      (pathname.startsWith("/auth/setup") || pathname.startsWith("/auth/account-setup")) &&
      profile?.role !== "admin"
    ) {
      return supabaseResponse;
    }

    // ✅ For users with complete onboarding, prevent access to auth pages
    if (hasCompletedOnboarding && pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect root path
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // Role-based access control for dashboards
    if (
      role === "admin" &&
      pathname.startsWith("/dashboard") &&
      pathname !== "/dashboard/suspended"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    if (role !== "admin" && pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
