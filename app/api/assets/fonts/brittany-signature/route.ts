import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const fontPath = path.join(
    process.cwd(),
    "components",
    "fonts",
    "BrittanySignature.ttf",
  );

  try {
    const file = await readFile(fontPath);
    return new NextResponse(file, {
      headers: {
        "content-type": "font/ttf",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Font not found" }, { status: 404 });
  }
}

