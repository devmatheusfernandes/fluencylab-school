"use client";
import UserProfileHeader from "@/components/shared/UserCard/UserProfileHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Calendar as CalendarIcon } from "lucide-react";
import { daysOfWeek } from "@/types/time/times";

export default function MyProfile() {
  const { user, isLoading } = useCurrentUser();
  const { myClasses, fetchMyClasses, isLoading: isClassesLoading } = useTeacher();
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    fetchMyClasses();
  }, [fetchMyClasses]);

  const daysOrder = useMemo(() => {
    return [...daysOfWeek.slice(1), daysOfWeek[0]];
  }, []);

  const weeklyGrouped = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekClasses = myClasses
      .filter((cls) => {
        const d = new Date(cls.scheduledAt as any);
        return d >= monday && d <= sunday && (cls.status as any) === "scheduled";
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt as any).getTime() -
          new Date(b.scheduledAt as any).getTime()
      );

    const map: Record<string, typeof weekClasses> = {};
    for (const cls of weekClasses) {
      const d = new Date(cls.scheduledAt as any);
      const dayName = daysOfWeek[d.getDay()];
      if (!map[dayName]) map[dayName] = [];
      map[dayName].push(cls);
    }
    return map;
  }, [myClasses]);

  return (
    <>
      {isLoading ? (
        <Skeleton className="w-full h-36" />
      ) : (
        <>
          <UserProfileHeader
            user={user!}
            onLogout={handleLogout}
            className="w-full"
          />

          <Card className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Text size="lg" className="font-bold text-slate-900 dark:text-slate-100">
                    Agenda semanal
                  </Text>
                  <Text size="sm" className="text-slate-600 dark:text-slate-400">
                    Suas aulas desta semana
                  </Text>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {isClassesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (
                <>
                  {daysOrder.map((dayName) => {
                    const dayClasses = weeklyGrouped[dayName] || [];
                    if (dayClasses.length === 0) return null;
                    return (
                      <div key={dayName} className="space-y-2">
                        <Text className="font-semibold text-slate-900 dark:text-slate-100">
                          {dayName}
                        </Text>
                        <div className="space-y-2">
                          {dayClasses.map((cls) => {
                            const d = new Date(cls.scheduledAt as any);
                            const time = d.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            return (
                              <div
                                key={`${cls.id}-${cls.scheduledAt}`}
                                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {time}
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-slate-300">
                                    {cls.studentName || "Aluno"}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {cls.language}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(weeklyGrouped).every((arr) => arr.length === 0) && (
                    <Text className="text-slate-600 dark:text-slate-400">Sem aulas nesta semana</Text>
                  )}
                </>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
