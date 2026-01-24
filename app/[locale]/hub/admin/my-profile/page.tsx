"use client";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { SubContainer } from "@/components/ui/sub-container";
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
        <SubContainer className="w-full">
          <UserProfileHeader
            user={user!}
            onLogout={handleLogout}
            className="w-full"
          />
        </SubContainer>
      )}
    </>
  );
}