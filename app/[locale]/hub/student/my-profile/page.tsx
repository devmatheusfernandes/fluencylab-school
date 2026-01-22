"use client";

import { useEffect, useState } from "react";
import { ContainerCard } from "@/components/ui/container";
import { SubContainer } from "@/components/ui/sub-container";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import NextClassCard from "@/components/student/NextClassCard";
import ProgressStatusCard from "@/components/student/ProgressStatusCard";
import { StudentPaymentStatusCard } from "@/components/student/StudentPaymentStatusCard";
import AchievementList from "@/components/student/AchievementList";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import Badges from "@/components/placement/Badges/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ProgressHero } from "@/components/notebook/ProgressHero";
import { motion } from "framer-motion";
import { getStudentLearningStats, getActivePlanId } from "@/actions/srs-actions";

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

const LEVEL_INDEX: Record<string, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export default function MeuPerfil() {
  const { user, isLoading } = useCurrentUser();
  const [placementBadgeLevel, setPlacementBadgeLevel] = useState<number | null>(null);
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [stats, setStats] = useState({ 
    reviewedToday: 0, 
    dueToday: 0, 
    totalLearned: 0, 
    currentDay: 1, 
    daysSinceClass: 7,
    hasActiveLesson: true
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (user?.id) {
        try {
          const planId = await getActivePlanId(user.id);
          if (planId) {
            const data = await getStudentLearningStats(planId);
            setStats(data);
          }
        } catch (err) {
          console.error("Failed to load stats", err);
        } finally {
          setStatsLoading(false);
        }
      }
    }
    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    const loadLatestPlacementResult = async () => {
      setIsPlacementLoading(true);
      setPlacementBadgeLevel(null);

      if (!user?.id) {
        setIsPlacementLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "placement_results"),
          where("userId", "==", user.id),
          orderBy("completedAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setIsPlacementLoading(false);
          return;
        }

        const data = snap.docs[0].data() as {
          assignedLevel?: string;
        };

        if (data.assignedLevel && LEVEL_INDEX[data.assignedLevel]) {
          setPlacementBadgeLevel(LEVEL_INDEX[data.assignedLevel]);
        } else {
          setPlacementBadgeLevel(0);
        }
      } catch (error) {
        console.error("Error loading latest placement result:", error);
        setPlacementBadgeLevel(null);
      } finally {
        setIsPlacementLoading(false);
      }
    };

    loadLatestPlacementResult();
  }, [user?.id]);

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {isLoading ? <NextClassCardSkeleton /> : <NextClassCard />}
      </SubContainer>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="p-0 bg-transparent dark:bg-transparent border-none"
      >
        {statsLoading ? (
          <Skeleton className="w-full h-full min-h-[140px] rounded-md" />
        ) : (
          <ProgressHero
            className="rounded-md!"
            currentDay={stats.currentDay}
            daysSinceClass={stats.daysSinceClass}
            hasActiveLesson={stats.hasActiveLesson}
          />
        )}
      </motion.div>

            
      <SubContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Badges
          level={placementBadgeLevel ?? 0}
          isLoading={isLoading || isPlacementLoading}
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
