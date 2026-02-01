// app/api/avatar/route.ts

import { NextResponse } from "next/server";
import { UserService } from "@/services/core/userService";
import { requireAuth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase/admin";
import { Readable } from "stream";
import { getUserById_Admin } from "@/repositories/admin/userAdminRepository";

const userService = new UserService();

// Helper function to convert ArrayBuffer to Readable stream
function arrayBufferToStream(arrayBuffer: ArrayBuffer): Readable {
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Helper function to extract file name from URL
function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // The file name should be the last part of the path
    return pathParts[pathParts.length - 1] || null;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // For file uploads, we need to use the FormData API
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de arquivo inválido. Por favor, selecione uma imagem (JPEG, PNG, GIF, WEBP).",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `A imagem deve ter menos de 5MB. Tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Check if storage is properly configured
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      console.error(
        "Firebase storage bucket not configured in environment variables"
      );
      return NextResponse.json(
        { error: "Storage not configured properly" },
        { status: 500 }
      );
    }

    // Get current user to check for existing avatar
    const currentUser = await getUserById_Admin(user.id);
    let oldAvatarFileName: string | null = null;

    // If user has an existing avatar, extract the file name for deletion
    if (currentUser?.avatarUrl) {
      oldAvatarFileName = extractFileNameFromUrl(currentUser.avatarUrl);
    }

    // Upload file to Firebase Storage using Admin SDK
    const fileName = `avatar_${Date.now()}.${file.type.split("/")[1]}`;
    const bucket = adminStorage.bucket(storageBucket);
    const fileRef = bucket.file(`avatars/${user.id}/${fileName}`);

    // Convert File to ArrayBuffer for Firebase upload
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

    // Make the file publicly readable
    await fileRef.makePublic();

    // Get the public URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    // Delete the old avatar if it exists
    if (oldAvatarFileName) {
      try {
        const oldFileRef = bucket.file(
          `avatars/${user.id}/${oldAvatarFileName}`
        );
        await oldFileRef.delete();
        console.log(`Deleted old avatar: ${oldAvatarFileName}`);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
        // Don't fail the whole operation if we can't delete the old avatar
      }
    }

    // Update user profile with new avatar URL
    await userService.updateUserAvatar(user.id, downloadURL);

    return NextResponse.json({
      message: "Avatar updated successfully",
      avatarUrl: downloadURL,
    });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
