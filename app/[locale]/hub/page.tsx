"use client";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HubEntryPoint() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role;
      const roleToPathMap: { [key: string]: string } = {
        admin: "hub/admin/my-profile",
        teacher: "hub/teacher/my-profile",
        student: "hub/student/my-profile",
        guarded_student: "hub/student/my-profile",
        material_manager: "hub/material-manager/my-profile",
        manager: "hub/manager/my-profile",
      };

      const destination = roleToPathMap[userRole] || "/";
      router.replace(destination);
    }
  }, [status, session, router]);

  return <SpinnerLoading />;
}
