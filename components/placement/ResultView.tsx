"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  BarChart,
  Clock,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { DiagnosticResult } from "../../types/placement/types";
import { SKILL_PAGE_SIZE, getMacroSkill, MAX_QUESTIONS } from "../../utils/placement-utils";

interface ResultViewProps {
  result: {
    score: number;
    level: string;
    diagnostics: DiagnosticResult;
    avgTime: number;
  };
  onBack: () => void;
  isHistoryView?: boolean;
}

export const ResultView = ({ result, onBack, isHistoryView }: ResultViewProps) => {
  const [skillViewMode, setSkillViewMode] = useState<"macro" | "topics">(
    "macro"
  );
  const [skillOffset, setSkillOffset] = useState(0);

  const chartData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.diagnostics).map(([topic, score]) => ({
      subject: topic.replace(/-/g, " "),
      score: score,
      fullMark: 100,
    }));
  }, [result]);

  const macroChartData = useMemo(() => {
    if (!result) return [];
    const groups: Record<string, { total: number; count: number }> = {};
    Object.entries(result.diagnostics).forEach(([topic, score]) => {
      const macro = getMacroSkill(topic);
      if (!groups[macro]) groups[macro] = { total: 0, count: 0 };
      groups[macro].total += score;
      groups[macro].count += 1;
    });
    return Object.entries(groups).map(([macro, info]) => ({
      subject: macro,
      score: Math.round(info.total / info.count),
      fullMark: 100,
    }));
  }, [result]);

  const visibleChartData = useMemo(() => {
    const activeData =
      skillViewMode === "macro" ? macroChartData : chartData;
    if (!activeData.length) return [];
    if (activeData.length <= SKILL_PAGE_SIZE) return activeData;
    const resultList = [];
    for (let i = 0; i < SKILL_PAGE_SIZE; i++) {
      const index = (skillOffset + i) % activeData.length;
      resultList.push(activeData[index]);
    }
    return resultList;
  }, [chartData, macroChartData, skillOffset, skillViewMode]);

  const totalSkillPages = useMemo(() => {
    const length =
      skillViewMode === "macro" ? macroChartData.length : chartData.length;
    if (!length) return 1;
    return Math.ceil(length / SKILL_PAGE_SIZE);
  }, [chartData.length, macroChartData.length, skillViewMode]);

  const currentSkillPage = useMemo(() => {
    const length =
      skillViewMode === "macro" ? macroChartData.length : chartData.length;
    if (!length) return 1;
    return Math.floor(skillOffset / SKILL_PAGE_SIZE) + 1;
  }, [skillOffset, chartData.length, macroChartData.length, skillViewMode]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full text-center space-y-8 max-w-2xl mx-auto"
    >
      {/* Celebration Header */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 animate-pulse" />
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white mb-6"
        >
          <Trophy className="h-16 w-16 text-white" />
        </motion.div>

        <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">
          Estimated Level
        </h2>
        <h1 className="text-6xl font-black text-foreground tracking-tighter mb-2">
          {result.level}
        </h1>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          You've mastered about{" "}
          {Math.round((result.score / (MAX_QUESTIONS * 6)) * 100)}%
          of the curriculum!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
          <div className="bg-green-100 p-2 rounded-full mb-2">
            <BarChart className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-slate-700">
            {result.score}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Points
          </span>
        </div>
        <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
          <div className="bg-indigo-100 p-2 rounded-full mb-2">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-2xl font-bold text-slate-700">
            {result.avgTime.toFixed(1)}s
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Avg Speed
          </span>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-black rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-black/50 h-[320px] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() =>
              setSkillOffset((prev) =>
                (skillViewMode === "macro"
                  ? macroChartData.length
                  : chartData.length)
                  ? (prev -
                      SKILL_PAGE_SIZE +
                      (skillViewMode === "macro"
                        ? macroChartData.length
                        : chartData.length)) %
                    (skillViewMode === "macro"
                      ? macroChartData.length
                      : chartData.length)
                  : 0
              )
            }
            disabled={
              (skillViewMode === "macro"
                ? macroChartData.length
                : chartData.length) <= SKILL_PAGE_SIZE
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {skillViewMode === "macro"
                ? "Macro Habilidades"
                : "Tópicos Detalhados"}
            </h3>
            {(skillViewMode === "macro"
              ? macroChartData.length
              : chartData.length) > SKILL_PAGE_SIZE && (
              <p className="text-[10px] text-slate-400 mt-1">
                Grupo {currentSkillPage} de {totalSkillPages}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={skillViewMode === "macro" ? "outline" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-wide"
              onClick={() => setSkillViewMode("macro")}
            >
              Macro
            </Button>
            <Button
              variant={skillViewMode === "topics" ? "outline" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-wide"
              onClick={() => setSkillViewMode("topics")}
            >
              Tópicos
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() =>
              setSkillOffset((prev) =>
                (skillViewMode === "macro"
                  ? macroChartData.length
                  : chartData.length)
                  ? (prev + SKILL_PAGE_SIZE) %
                    (skillViewMode === "macro"
                      ? macroChartData.length
                      : chartData.length)
                  : 0
              )
            }
            disabled={
              (skillViewMode === "macro"
                ? macroChartData.length
                : chartData.length) <= SKILL_PAGE_SIZE
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={visibleChartData}
          >
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Student"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-4">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold uppercase tracking-wider rounded-2xl bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
          onClick={onBack}
        >
          {isHistoryView ? "Back to History" : "Go back"}
        </Button>
      </div>
    </motion.div>
  );
};
