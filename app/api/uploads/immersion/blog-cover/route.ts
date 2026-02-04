import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase/admin";
import { Readable } from "stream";
import { getUserById_Admin } from "@/repositories/admin/userAdminRepository";
import { UserRoles } from "@/types/users/userRoles";

function arrayBufferToStream(arrayBuffer: ArrayBuffer): Readable {
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const userDb = await getUserById_Admin(user.id);

    if (
      !userDb ||
      (userDb.role !== UserRoles.MATERIAL_MANAGER &&
        userDb.role !== UserRoles.ADMIN)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size is 5MB. Current: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      return NextResponse.json(
        { error: "Storage not configured properly" },
        { status: 500 }
      );
    }

    const fileName = `blog_cover_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const bucket = adminStorage.bucket(storageBucket);
    const fileRef = bucket.file(`immersion/blogs/${fileName}`);

    const arrayBuffer = await file.arrayBuffer();
    const stream = arrayBufferToStream(arrayBuffer);

    await new Promise((resolve, reject) => {
      const writeStream = fileRef.createWriteStream({
        metadata: {
          contentType: file.type,
        },
      });
      stream.pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    await fileRef.makePublic();
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return NextResponse.json({
      message: "Blog cover uploaded successfully",
      url: downloadURL,
    });
  } catch (error: any) {
    console.error("Error uploading blog cover:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload blog cover" },
      { status: 500 }
    );
  }
}
