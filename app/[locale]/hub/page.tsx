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

      // UPDATED: Maps each role to the new URL structure
      const roleToPathMap: { [key: string]: string } = {
        admin: "hub/admin/my-profile",
        teacher: "hub/teacher/my-profile",
        student: "hub/student/my-profile",
        material_manager: "hub/material-manager/my-profile",
        manager: "hub/manager/my-profile",
      };

      const destination = roleToPathMap[userRole] || "/";

      // router.replace to not add this page to browser history
      router.replace(destination);
    }
  }, [status, session, router]);

  // Displays a loading screen while session is being verified
  return (
    <div className="h-full justify-center items-center">
      <SpinnerLoading />
    </div>
  );
}
