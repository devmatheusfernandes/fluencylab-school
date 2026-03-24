import { NextRequest, NextResponse } from "next/server";
import { generalRateLimiter } from "@/lib/security/rateLimit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type ImageResult = {
  id: string;
  description: string | null;
  altDescription: string | null;
  width: number;
  height: number;
  color: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    smallS3?: string;
  };
  author: {
    name: string;
    username: string;
    profileImage?: {
      small: string;
      medium: string;
      large: string;
    };
    links?: {
      html?: string;
    };
  };
  links: {
    html: string;
  };
};

function mapUnsplashPhoto(photo: any): ImageResult {
  return {
    id: photo.id,
    description: photo.description ?? null,
    altDescription: photo.alt_description ?? null,
    width: photo.width,
    height: photo.height,
    color: photo.color ?? null,
    urls: {
      raw: photo.urls?.raw,
      full: photo.urls?.full,
      regular: photo.urls?.regular,
      small: photo.urls?.small,
      thumb: photo.urls?.thumb,
      smallS3: photo.urls?.small_s3,
    },
    author: {
      name: photo.user?.name,
      username: photo.user?.username,
      profileImage: photo.user?.profile_image,
      links: photo.user?.links,
    },
    links: {
      html: photo.links?.html,
    },
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = generalRateLimiter(request);
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": `${Math.ceil((rate.resetTime! - Date.now()) / 1000)}`,
        },
      }
    );
  }

  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim();
  const page = Math.max(1, Number(params.get("page") || 1));
  const perPage = Math.min(
    30,
    Math.max(1, Number(params.get("per_page") || 10))
  );

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: "Unsplash access key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Version": "v1",
        Authorization: `Client-ID ${accessKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch from Unsplash", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const results = Array.isArray(data.results)
      ? data.results.map(mapUnsplashPhoto)
      : [];

    return NextResponse.json({
      total: data.total ?? results.length,
      totalPages: data.total_pages ?? 1,
      page,
      perPage,
      query,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
