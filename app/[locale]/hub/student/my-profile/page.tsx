"use client";

import { ContainerCard } from "@/components/ui/container";
import { SubContainer } from "@/components/ui/sub-container";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import NextClassCard from "@/components/student/NextClassCard";
import ProgressStatusCard from "@/components/student/ProgressStatusCard";
import { StudentPaymentStatusCard } from "@/components/student/StudentPaymentStatusCard";
import { usePlacementTests } from "@/hooks/usePlacementTests";
import AchievementList from "@/components/student/AchievementList";
import { determineCEFRLevel } from "@/utils/utils";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import Badges from "@/components/placement/Badges/Badges";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileHeaderSkeleton = () => (
  <Skeleton className="skeleton-base rounded-xl p-4 w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="skeleton-sub w-16 h-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="skeleton-sub h-5 w-40" />
          <Skeleton className="skeleton-sub h-4 w-56" />
          <Skeleton className="skeleton-sub h-5 w-20" />
        </div>
      </div>
      <Skeleton className="skeleton-sub w-9 h-9 rounded-lg" />
    </div>
  </Skeleton>
);

const NextClassCardSkeleton = () => (
  <Skeleton className="skeleton-base rounded-xl p-4 w-full">
    <div className="flex justify-between items-start">
      <Skeleton className="skeleton-sub h-5 w-24" />
      <Skeleton className="skeleton-sub w-9 h-9 rounded-lg" />
    </div>
    <div className="flex flex-col mt-2 space-y-2">
      <Skeleton className="skeleton-sub h-4 w-32" />
      <Skeleton className="skeleton-sub h-4 w-24" />
    </div>
  </Skeleton>
);

const AchievementsSkeleton = ({ limit = 3 }: { limit?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: limit }).map((_, index) => (
      <div key={index} className="skeleton-base rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="skeleton-sub w-14 h-14 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="skeleton-sub h-5 w-3/4" />
            <Skeleton className="skeleton-sub h-4 w-full" />
            <Skeleton className="skeleton-sub h-3 w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function MeuPerfil() {
  const { user, isLoading } = useCurrentUser();
  const { tests } = usePlacementTests();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <ContainerCard
      className="
        grid gap-2
        grid-cols-1
        md:grid-cols-3
        "
    >
      <SubContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {!isLoading && user ? (
          <UserProfileHeader user={user} onLogout={handleLogout} />
        ) : (
          <ProfileHeaderSkeleton />
        )}
      </SubContainer>

      <SubContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <ProgressStatusCard />
      </SubContainer>

      <SubContainer
        className="md:row-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <StudentPaymentStatusCard />
      </SubContainer>

      <SubContainer
        className="md:col-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {isLoading ? <NextClassCardSkeleton /> : <NextClassCard />}
      </SubContainer>

      <SubContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Badges
          level={determineCEFRLevel(tests[0]?.totalScore || 0)}
          isLoading={isLoading}
        />
      </SubContainer>

      <SubContainer
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="md:col-span-2"
      >
        {isLoading || !user ? (
          <AchievementsSkeleton limit={3} />
        ) : (
          <AchievementList userId={user?.id} limit={3} />
        )}
      </SubContainer>
    </ContainerCard>
  );
}
