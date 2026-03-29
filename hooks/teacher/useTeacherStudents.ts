"use client";

import useSWR from "swr";

export interface TeacherStudentWithNextClass {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nextClass: {
    scheduledAt: string | Date;
    language: string;
  } | null;
}

async function fetchTeacherStudents(
  url: string,
): Promise<TeacherStudentWithNextClass[]> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && (body.error || body.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export function useTeacherStudents(enabled: boolean) {
  return useSWR<TeacherStudentWithNextClass[]>(
    enabled ? "/api/teacher/my-students" : null,
    fetchTeacherStudents,
    { keepPreviousData: true },
  );
}
