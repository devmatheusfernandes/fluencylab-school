import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/demo/professor", "/demo/aluno", "/privacidade"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
