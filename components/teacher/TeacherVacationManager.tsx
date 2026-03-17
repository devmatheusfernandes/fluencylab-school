"use client";

import { useEffect, useState } from "react";
import { useTeacher } from "@/hooks/teacher/useTeacher";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { Text } from "../ui/text";
import { Calendar, Info, Clock, History } from "lucide-react";
import { Card } from "../ui/card";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import TeacherVacationList from "./TeacherVacationList";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

export default function TeacherVacationManager() {
  const t = useTranslations("TeacherSchedule.Vacation");
  const { requestVacation, isLoading, vacations, fetchMyVacations } =
    useTeacher();
  const { user } = useCurrentUser();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchMyVacations();
  }, [fetchMyVacations]);

  const handleRequestVacation = async () => {
    if (!startDate || !endDate) return;
    await requestVacation(startDate, endDate);
    setStartDate(null);
    setEndDate(null);
  };

  const remainingDays = user?.vacationDaysRemaining;
  const vacationDays =
    startDate && endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const isValidPeriod = startDate && endDate && startDate <= endDate;
  const exceedsLimit = vacationDays > (remainingDays || 0);
  const minStartDate = new Date();
  minStartDate.setDate(minStartDate.getDate() + 40);
  const maxEndDate = startDate ? new Date(startDate) : null;
  if (maxEndDate) {
    maxEndDate.setDate(maxEndDate.getDate() + 13);
  }
  const toDateInputString = (date: Date) => {
    const d = new Date(date.getTime());
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };
  const parseDateInput = (value: string): Date | null => {
    const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  return (
    <div className="mt-4 space-y-6">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Text
                size="lg"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                {t("balanceCard.title")}
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                {t("balanceCard.subtitle")}
              </Text>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
              <Text
                size="lg"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                {t.rich("balanceCard.remainingText", {
                  days: remainingDays || 0,
                  highlight: (chunks) => (
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl ml-1">
                      {chunks}
                    </span>
                  ),
                })}
              </Text>
              <div className="text-4xl">🏖️</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <Text
                size="lg"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                {t("requestCard.title")}
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                {t("requestCard.subtitle")}
              </Text>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <Text
              variant="paragraph"
              className="text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              {t("requestCard.info")}
            </Text>
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold mb-2">
              {t("rules.title")}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>{t("rules.advance")}</li>
                <li>{t("rules.duration")}</li>
                <li>{t("rules.cancellation")}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="date"
                value={startDate ? toDateInputString(startDate) : ""}
                onChange={(e) => {
                  const d = parseDateInput(e.target.value);
                  setStartDate(d);
                  setEndDate(null);
                }}
                placeholder={t("form.startDatePlaceholder")}
                min={toDateInputString(minStartDate)}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={endDate ? toDateInputString(endDate) : ""}
                onChange={(e) => {
                  const d = parseDateInput(e.target.value);
                  setEndDate(d);
                }}
                placeholder={t("form.endDatePlaceholder")}
                min={toDateInputString(startDate || minStartDate)}
                max={maxEndDate ? toDateInputString(maxEndDate) : undefined}
                disabled={isLoading || !startDate}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <Button
              onClick={handleRequestVacation}
              disabled={isLoading || !isValidPeriod || exceedsLimit}
              className="w-full md:w-auto md:min-w-[140px]"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("form.submitButton")}
                </div>
              )}
            </Button>
          </div>

          {isValidPeriod && (
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <Text
                    size="sm"
                    className="font-semibold text-emerald-800 dark:text-emerald-300"
                  >
                    {t("summary.title")}
                  </Text>
                  <Text
                    size="sm"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    {t("summary.daysRequested", {
                      days: vacationDays,
                      count: vacationDays,
                    })}
                  </Text>
                </div>
                <div className="text-right">
                  <Text
                    size="sm"
                    className="font-semibold text-emerald-800 dark:text-emerald-300"
                  >
                    {t("summary.remainingAfter")}
                  </Text>
                  <Text
                    size="sm"
                    className={
                      exceedsLimit
                        ? "text-red-600 dark:text-red-400 font-bold"
                        : "text-emerald-600 dark:text-emerald-400 font-medium"
                    }
                  >
                    {exceedsLimit
                      ? t("summary.exceedsBy", {
                          days: vacationDays - (remainingDays || 0),
                        })
                      : t("summary.remainingDays", {
                          days: (remainingDays || 0) - vacationDays,
                        })}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {exceedsLimit && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <Text
                    size="sm"
                    className="font-semibold text-red-800 dark:text-red-300"
                  >
                    {t("errors.invalidPeriodTitle")}
                  </Text>
                  <Text size="sm" className="text-red-600 dark:text-red-400">
                    {t("errors.invalidPeriodMessage")}
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <Text
                size="lg"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                {t("history.title")}
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                {t("history.subtitle")}
              </Text>
            </div>
          </div>
        </div>
        <div className="p-0 sm:p-2">
          <TeacherVacationList
            vacations={vacations}
            onDelete={fetchMyVacations}
          />
        </div>
      </Card>
    </div>
  );
}
