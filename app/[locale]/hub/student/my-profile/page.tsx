"use client";

import { useEffect, useState } from "react";
import { ContainerCard } from "@/components/ui/container";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { signOut } from "next-auth/react";
import NextClassCard from "@/components/student/NextClassCard";
import ProgressStatusCard from "@/components/student/ProgressStatusCard";
import { StudentPaymentStatusCard } from "@/components/student/StudentPaymentStatusCard";
import AchievementList from "@/components/student/AchievementList";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import Badges from "@/components/placement/Badges/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ProgressHero } from "@/components/notebook/ProgressHero";
import { motion } from "framer-motion";
import { getStudentLearningStats, getActivePlanId } from "@/actions/srsActions";
import { WordOfTheDayModal } from "@/components/word-of-the-day/word-of-the-day-modal";

const ProfileHeaderSkeleton = () => (
  <Skeleton className="rounded-xl p-4 w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="w-9 h-9 rounded-lg" />
    </div>
  </Skeleton>
);

const NextClassCardSkeleton = () => (
  <Skeleton className="rounded-xl p-4 w-full">
    <div className="flex justify-between items-start">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="w-9 h-9 rounded-lg" />
    </div>
    <div className="flex flex-col mt-2 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  </Skeleton>
);

const AchievementsSkeleton = ({ limit = 3 }: { limit?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: limit }).map((_, index) => (
      <Skeleton key={index} className=" rounded-2xl p-5 min-h-[160px]">
        <div className="flex items-start gap-4">
          <Skeleton className=" w-14 h-14 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className=" h-5 w-3/4" />
            <Skeleton className=" h-4 w-full" />
            <Skeleton className=" h-3 w-1/2" />
          </div>
        </div>
      </Skeleton>
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
  const [placementBadgeLevel, setPlacementBadgeLevel] = useState<number | null>(
    null,
  );
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [stats, setStats] = useState({
    reviewedToday: 0,
    dueToday: 0,
    totalLearned: 0,
    currentDay: 1,
    daysSinceClass: 7,
    hasActiveLesson: true,
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
            console.log("Stats:", data);
          } else {
            setStats({
              reviewedToday: 0,
              dueToday: 0,
              totalLearned: 0,
              currentDay: 1,
              daysSinceClass: 7,
              hasActiveLesson: false,
            });
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
          limit(1),
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
      } catch (error: any) {
        console.error("Error loading latest placement result:", error);

        if (
          error?.code === "failed-precondition" &&
          error?.message?.includes("index")
        ) {
          const match = error.message.match(
            /https:\/\/console\.firebase\.google\.com[^\s]*/,
          );
          if (match) {
            console.log(
              "%c [Firestore] Link para criar índice ausente:",
              "color: yellow; font-weight: bold; font-size: 12px;",
            );
            console.log(match[0]);
          }
        }

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
        lg:p-0 md:p-0 p-4 lg:space-y-0 md:space-y-0 space-y-2
        "
    >
      <WordOfTheDayModal language={user?.languages?.[0] || "en"} />

      {!isLoading && user ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="card-base p-3"
        >
          <UserProfileHeader user={user} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <ProfileHeaderSkeleton />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <ProgressStatusCard />
      </motion.div>

      <motion.div
        className="md:row-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <StudentPaymentStatusCard />
      </motion.div>

      {isLoading || !user ? (
        <NextClassCardSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="card-base p-4"
        >
          <NextClassCard />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="p-0 bg-transparent dark:bg-transparent border-none min-h-[140px] max-h-[300px]"
      >
        {statsLoading ? (
          <Skeleton className="w-full h-full rounded-md min-h-[140px]" />
        ) : (
          <ProgressHero
            className="rounded-md!"
            currentDay={stats.currentDay}
            daysSinceClass={stats.daysSinceClass}
            hasActiveLesson={stats.hasActiveLesson}
          />
        )}
      </motion.div>

      {isPlacementLoading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-base"
        >
          <Skeleton className="w-full h-full p-3 flex flex-col items-center justify-center">
            <Skeleton className="rounded-full w-[5.9rem] h-[5.9rem]" />
            <Skeleton className="h-6 w-24 mt-2 rounded-md" />
            <Skeleton className="h-4 w-32 mt-1 rounded-md" />
          </Skeleton>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-base p-3"
        >
          <Badges
            level={placementBadgeLevel ?? 0}
            isLoading={isLoading || isPlacementLoading}
          />
        </motion.div>
      )}

      {!isLoading || !user ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="md:col-span-2"
        >
          <AchievementList userId={user?.id} limit={3} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="md:col-span-2 p-1"
        >
          <AchievementsSkeleton limit={3} />
        </motion.div>
      )}
    </ContainerCard>
  );
}
