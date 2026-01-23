import createMiddleware from "next-intl/middleware";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["en", "pt"],
  defaultLocale: "pt",
  localePrefix: "always",
});

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    /^\/(en|pt)\/(signin|signup)(\/|$)/.test(pathname)
  );
}

function isHubRoute(pathname: string) {
  return pathname.startsWith("/hub") || /^\/(en|pt)\/hub(\/|$)/.test(pathname);
}

export default withAuth(
  function middleware(req) {
    // Primeiro aplica i18n para manter prefixo de locale
    const res = intlMiddleware(req);

    // Ajuste de segurança para o cookie NEXT_LOCALE
    const nextLocaleCookie = res.cookies.get("NEXT_LOCALE");
    if (nextLocaleCookie) {
      res.cookies.set("NEXT_LOCALE", nextLocaleCookie.value, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    const { token } = (req as any).nextauth || {};

    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/");
    const maybeLocale = segments[1];
    const currentLocale = ["en", "pt"].includes(maybeLocale)
      ? maybeLocale
      : undefined;

    // Se autenticado e acessando páginas de auth, redireciona para hub (locale-aware)
    if (token && isAuthPage(pathname)) {
      const hubPath = currentLocale ? `/${currentLocale}/hub` : "/hub";
      return NextResponse.redirect(new URL(hubPath, req.url));
    }

    // Validação de Roles
    if (token) {
      const userRole = token.role as string;
      // Remove o locale da URL para verificação (ex: /pt/hub/admin -> /hub/admin)
      const cleanPath = currentLocale ? pathname.replace(`/${currentLocale}`, "") : pathname;

      // Mapa de rotas protegidas e roles permitidas
      const protectedRoutes = [
        { 
          prefix: "/hub/admin", 
          allowed: ["admin"] 
        },
        { 
          prefix: "/hub/manager", 
          allowed: ["manager", "admin"] 
        },
        { 
          prefix: "/hub/teacher", 
          allowed: ["teacher", "admin"] 
        },
        { 
          prefix: "/hub/student", 
          allowed: ["student", "guarded_student", "admin"] 
        },
        { 
          prefix: "/hub/material-manager", 
          allowed: ["material_manager", "admin"] 
        },
      ];

      for (const route of protectedRoutes) {
        if (cleanPath.startsWith(route.prefix) && !route.allowed.includes(userRole)) {
          // Se não tiver permissão, redireciona para o hub principal
          // O HubEntryPoint cuidará do redirecionamento correto baseado na role
          const hubPath = currentLocale ? `/${currentLocale}/hub` : "/hub";
          return NextResponse.redirect(new URL(hubPath, req.url));
        }
      }
    }

    // Se não autenticado e acessando rotas do hub, redireciona para signin com locale
    if (!token && isHubRoute(pathname)) {
      const signInPath = currentLocale ? `/${currentLocale}/signin` : "/signin";
      return NextResponse.redirect(new URL(signInPath, req.url));
    }

    return res;
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
