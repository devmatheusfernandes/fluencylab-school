"use client";
import { useSession } from "next-auth/react";
import { useStudentPanel } from "@/hooks/useStudentPanel";
import { Spinner } from "@/components/ui/spinner";
import { Container } from "@/components/ui/container";
import NotebooksCard from "@/components/teacher/NotebooksCard";
import { LearningPath } from "@/components/notebook/LearningPath";
import { StatsDashboard } from "@/components/notebook/StatsDashboard";
import { useEffect, useState } from "react";
import { getStudentLearningStats, getActivePlanId } from "@/actions/srs-actions";
import ErrorAlert from "@/components/ui/error-alert";
import { SubContainer } from "@/components/ui/sub-container";
import { ProgressHero } from "@/components/notebook/ProgressHero";

export default function Caderno() {
  const { data: session } = useSession();
  const studentId = session?.user?.id;

  const { student, notebooks, loading, error } = useStudentPanel(studentId as string);

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
        if (studentId) {
            try {
                const planId = await getActivePlanId(studentId);
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
  }, [studentId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Container className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        
        {/* ESQUERDA: LEARNING PATH (lg:col-span-3) */}
        {/* No mobile, fica em segundo (order-2) */}
        <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col">
          <NotebooksCard
                student={student}
                notebooks={notebooks}
                onCreateNotebook={async () => false}
                userRole="student"
                onAddTask={undefined}
                loading={loading}
             />
        </div>

        {/* MEIO: GHOST (Cima) + STATS (Baixo) (lg:col-span-5) */}
        {/* No mobile, o Ghost é o primeiro destaque (order-1) */}
        <div className="lg:col-span-3 order-1 lg:order-2 flex flex-col gap-4 max-h-[calc(100vh-105px)] overflow-auto">
            
            {/* GHOST (Cima) */}
            <ProgressHero 
                currentDay={stats.currentDay} 
                daysSinceClass={stats.daysSinceClass}
                hasActiveLesson={stats.hasActiveLesson}
            />

            {/* STATS (Baixo) */}
            <div className="flex-none flex flex-col">
                 {statsLoading ? (
                    <Spinner /> 
                 ) : (
                    <StatsDashboard 
                        reviewedToday={stats.reviewedToday} 
                        dueToday={stats.dueToday} 
                        totalLearned={stats.totalLearned} 
                    />
                 )}
            </div>
        </div>

        {/* DIREITA: NOTEBOOKS (lg:col-span-4) */}
        {/* No mobile, fica por último (order-3) */}
        <div className="lg:col-span-4 order-3 lg:order-3">
             <SubContainer className="h-full max-h-[calc(100vh-105px)] overflow-auto">
             <h3 className="text-lg font-bold text-center mb-6 text-slate-700 dark:text-slate-300">Missions</h3>
             {statsLoading ? (
                 <div className="flex justify-center p-4"><Spinner /></div>
             ) : (
                 <LearningPath 
                    currentDay={stats.currentDay} 
                    daysSinceClass={stats.daysSinceClass} 
                    hasActiveLesson={stats.hasActiveLesson}
                 />
             )}
          </SubContainer>
        </div>

      </div>
    </Container>
  );
}