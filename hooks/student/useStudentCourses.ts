 "use client";

 import useSWR from "swr";
 import { Course } from "@/types/quiz/types";

 export type StudentCourse = Course & {
   sectionCount: number;
   lessonCount: number;
   isEnrolled: boolean;
 };

 async function fetchStudentCourses(url: string): Promise<StudentCourse[]> {
   const res = await fetch(url);
   if (!res.ok) {
     const body = await res.json().catch(() => null);
     const message =
       (body && (body.error || body.message)) || `Request failed (${res.status})`;
     throw new Error(message);
   }
   return res.json();
 }

 export function useStudentCourses(enabled: boolean) {
   return useSWR<StudentCourse[]>(
     enabled ? "/api/student/courses/list" : null,
     fetchStudentCourses,
     { keepPreviousData: true },
   );
 }

