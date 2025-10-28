//@types/users/userRoles.ts

export enum UserRoles {
  ADMIN = "admin",
  MANAGER = "manager",
  STUDENT = "student",
  TEACHER = "teacher",
  GUARDED_STUDENT = "guarded_student",
  MATERIAL_MANAGER = "material_manager",
}

// Summary of the roles and their permissions
// ADMIN: has full system access and management capabilities
// MANAGER: has access to all reports and finances
// STUDENT: has access to the courses and materials they are enrolled in
// TEACHER: has access to the courses and materials they are enrolled in
// GUARDED_STUDENT: has access to the courses and materials they are enrolled in
// MATERIAL_MANAGER: has access to the courses and materials they are enrolled in
