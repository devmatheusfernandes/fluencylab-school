import type { MetadataRoute } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserAdminRepository } from "@/repositories/admin/userAdminRepository";

const THEME_COLORS = {
  violet: "#7c3aed",
  rose: "#e11d48",
  indigo: "#4f46e5",
  yellow: "#f59e0b",
  green: "#059669",
} as const;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const session = await getServerSession(authOptions);
  let themeColor: string = THEME_COLORS.violet;

  if (session?.user?.id) {
    try {
      const userAdminRepo = new UserAdminRepository();
      const user = await userAdminRepo.findUserById(session.user.id);
      if (user?.themeColor && user.themeColor in THEME_COLORS) {
        themeColor = THEME_COLORS[user.themeColor as keyof typeof THEME_COLORS];
      }
    } catch (error) {
      console.error("Error fetching user theme for manifest:", error);
    }
  }

  return {
    name: "FluencyLab School",
    short_name: "FluencyLab",
    description: "Aplicativo da FluencyLab School",
    start_url: "/hub",
    id: "/",
    display: "standalone",
    display_override: ["window-controls-overlay"],
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity"],
    lang: "pt-BR",
    prefer_related_applications: false,
  };
}
