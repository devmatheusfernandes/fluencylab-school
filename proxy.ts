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

    // Se não autenticado e acessando rotas do hub, redireciona para signin com locale
    if (!token && isHubRoute(pathname)) {
      const signInPath = currentLocale ? `/${currentLocale}/signin` : "/signin";
      return NextResponse.redirect(new URL(signInPath, req.url));
    }

    return res;
  },
  {
    callbacks: {
      // Deixamos sempre true e tratamos redirecionamentos acima para controlar locale
      authorized: () => true,
    },
  }
);

export const config = {
  // Mantém abrangência para i18n e aplica regras de auth onde necessário
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
