"use server";

import { UserAdminRepository } from "@/repositories/admin/userAdminRepository";

export async function searchStudents(query: string = "") {
  const repo = new UserAdminRepository();
  const students = await repo.findUsersByRole("student");
  
  // Also include guarded_student? The original page did.
  const guarded = await repo.findUsersByRole("guarded_student");
  
  const all = [...students, ...guarded];
  
  if (!query) return all;
  
  const lowerQuery = query.toLowerCase();
  return all.filter(u => 
    u.name?.toLowerCase().includes(lowerQuery) || 
    u.email?.toLowerCase().includes(lowerQuery)
  );
}
