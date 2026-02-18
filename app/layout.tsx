import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import { Quicksand } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserAdminRepository } from "@/repositories/admin/userAdminRepository";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Fluency Lab",
  description:
    "Aplicativo web da Fluency Lab, uma plataforma de ensino de idiomas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fluency Lab",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e2e8f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  let themeColorClass = "theme-violet";

  if (session?.user?.id) {
    const userAdminRepo = new UserAdminRepository();
    const user = await userAdminRepo.findUserById(session.user.id);
    if (user?.themeColor) {
      themeColorClass = `theme-${user.themeColor}`;
    }
  }

  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={themeColorClass}
      data-scroll-behavior="smooth"
    >
      <body className={quicksand.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
