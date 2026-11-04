import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { PRODUCT_NAME, SITE_URL } from "@/lib/config";

const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik", display: "swap" });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

const description =
  "Contratos, cobrança, aulas em vídeo e acompanhamento do aluno em um só lugar, com a sua marca. Plataforma para professores de idiomas independentes. Entre na lista de espera.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PRODUCT_NAME} · A plataforma para professores independentes`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description,
  openGraph: {
    title: `${PRODUCT_NAME} · Você ensina. A plataforma cuida do resto.`,
    description,
    type: "website",
    locale: "pt_BR",
    siteName: PRODUCT_NAME,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#12263a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${rubik.variable} ${nunito.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
