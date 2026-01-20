"use client";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";

export default function MyProfile() {
  const { user, isLoading } = useCurrentUser();
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {isLoading ? (
        <Skeleton className="w-full h-36" />
      ) : (
        <UserProfileHeader
          user={user!}
          onLogout={handleLogout}
          className="w-full"
        />
      )}
    </>
  );
}