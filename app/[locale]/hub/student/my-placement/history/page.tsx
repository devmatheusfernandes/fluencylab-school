"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Calendar, ChevronRight, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HistoryItem } from "../../../../../../types/placement/types";
import { ResultView } from "../../../../../../components/placement/ResultView";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";

export default function HistoryPage() {
  const { data: session } = useSession();
  const t = useTranslations("Placement");
  const tLang = useTranslations("Languages");
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const historyRef = collection(db, "placement_results");
        const q = query(
          historyRef,
          where("userId", "==", session.user.id),
          orderBy("completedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const historyData: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
          historyData.push({ id: doc.id, ...doc.data() } as HistoryItem);
        });
        setHistoryList(historyData);
      } catch (error) {
        console.error("Error loading history:", error);
        toast.error(t("errorHistory"));
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4 max-w-md mx-auto">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="p-6">
        <ResultView
          result={{
            score: selectedItem.totalScore,
            level: selectedItem.assignedLevel,
            diagnostics: selectedItem.diagnostics,
            avgTime: selectedItem.averageTimePerQuestion || 0,
          }}
          onBack={() => setSelectedItem(null)}
          isHistoryView
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 px-4 w-full">
      <div className="space-y-4">
        <Header
          heading={t("historyTitle")}
          backHref="/hub/student/my-placement"
          icon={<History className="h-8 w-8 text-primary" />}
          subheading={t("historySubheading")}
        />

        {historyList.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {t("noHistory")}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {historyList.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className="group flex items-center justify-between p-4 bg-card rounded-xl border-2 border-accent hover:border-slate-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                        item.assignedLevel.startsWith("A")
                          ? "bg-orange-400"
                          : item.assignedLevel.startsWith("B")
                          ? "bg-blue-400"
                          : "bg-purple-400"
                      }`}
                    >
                      {item.assignedLevel}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">
                        {item.language === "en"
                          ? tLang("english")
                          : tLang("portuguese")}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        {item.completedAt?.toDate
                          ? item.completedAt.toDate().toLocaleDateString()
                          : t("unknownDate")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
