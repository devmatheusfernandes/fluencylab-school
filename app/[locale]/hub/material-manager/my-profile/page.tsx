"use client";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { signOut } from "next-auth/react";

export default function MyProfile() {
  const { user, isLoading } = useCurrentUser();
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="container-padding space-y-4">
      {isLoading ? (
        <Skeleton className="w-full h-26" />
      ) : (
        <Card className="w-full">
          <UserProfileHeader
            user={user!}
            onLogout={handleLogout}
            className="w-full"
          />
        </Card>
      )}
    </div>
  );
}
