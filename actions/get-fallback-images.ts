"use server";

import fs from "fs";
import path from "path";

export async function getFallbackImages() {
  try {
    const imagesDirectory = path.join(
      process.cwd(),
      "public/images/profile-pictures-fallback",
    );

    // Check if directory exists
    if (!fs.existsSync(imagesDirectory)) {
      console.warn("Fallback images directory not found:", imagesDirectory);
      return [];
    }

    const filenames = await fs.promises.readdir(imagesDirectory);

    // Filter for image files only and map to public paths
    return filenames
      .filter((file) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
      .map((name) => `/images/profile-pictures-fallback/${name}`);
  } catch (error) {
    console.error("Error reading fallback images:", error);
    return [];
  }
}
