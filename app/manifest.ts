import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FluencyLab School",
    short_name: "FluencyLab",
    description: "Aplicativo da FluencyLab School",
    start_url: "/hub",
    id: "/",
    display: "standalone",
    display_override: ["window-controls-overlay"],
    orientation: "portrait",
    theme_color: "transparent",
    background_color: "#ffffff",
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
