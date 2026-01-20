'use server';

import { adminDb } from "@/lib/firebase/admin";

export async function searchLessons(query: string) {
  try {
    // Strategy: Fetch recent lessons and filter in-memory to support case-insensitive search.
    // This avoids the need for a specific Firestore index or normalized 'search_title' field for now.
    
    // 1. Fetch the 50 most recently updated lessons
    // We use metadata.updatedAt because it's the most relevant for active content.
    const snapshot = await adminDb
      .collection("lessons")
      .orderBy("metadata.updatedAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || "Untitled Lesson",
      // We can return more fields if needed
    }));

    // 2. Filter in-memory if there is a query
    if (query && query.trim().length > 0) {
      const lowerQuery = query.toLowerCase().trim();
      return lessons.filter(lesson => 
        lesson.title.toLowerCase().includes(lowerQuery)
      );
    }

    // If no query, return the recent lessons (useful for initial list)
    return lessons;

  } catch (error) {
    console.error("Error searching lessons:", error);
    // Fallback: If sorting by metadata.updatedAt fails (e.g. missing index), try a simple fetch
    try {
        const snapshot = await adminDb.collection("lessons").limit(20).get();
        const lessons = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || "Untitled Lesson",
        }));
        
        if (query && query.trim().length > 0) {
            const lowerQuery = query.toLowerCase().trim();
            return lessons.filter(lesson => 
              lesson.title.toLowerCase().includes(lowerQuery)
            );
        }
        return lessons;
    } catch (fallbackError) {
        console.error("Fallback search failed:", fallbackError);
        return [];
    }
  }
}
