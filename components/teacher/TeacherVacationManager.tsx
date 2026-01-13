"use client";

import { useEffect, useState } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Text } from "../ui/text";
import { Calendar, Info } from "lucide-react";
import { Card } from "../ui/card";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import DatePicker from "../ui/date-picker";
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
    // Clear form after successful submission
    setStartDate(null);
    setEndDate(null);
  };

  const remainingDays = user?.vacationDaysRemaining;

  // Calculate vacation period length
  const vacationDays =
    startDate && endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const isValidPeriod = startDate && endDate && startDate <= endDate;
  const exceedsLimit = vacationDays > (remainingDays || 0);

  // Calculate min start date (40 days from now)
  const minStartDate = new Date();
  minStartDate.setDate(minStartDate.getDate() + 40);

  // Calculate max end date (14 days from start date)
  const maxEndDate = startDate ? new Date(startDate) : null;
  if (maxEndDate) {
    maxEndDate.setDate(maxEndDate.getDate() + 13); // +13 because start date counts as day 1
  }

  return (
    <div className="mt-4 mx-auto space-y-8">
      {/* Vacation Status Card */}
      <Card className="card-base border-blue-200 dark:border-blue-800">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Text className="font-bold text-blue-900 dark:text-blue-100">
                {t("balanceCard.title")}
              </Text>
              <Text size="sm" className="text-blue-600 dark:text-blue-300">
                {t("balanceCard.subtitle")}
              </Text>
            </div>
          </div>

          <div className="card-base rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <Text
                size="lg"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                {t.rich("balanceCard.remainingText", {
                  days: remainingDays || 0,
                  highlight: (chunks) => (
                    <span className="text-primary font-bold">{chunks}</span>
                  ),
                })}
              </Text>
              <div className="text-4xl">🏖️</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vacation Request Form */}
      <Card>
        <div className="flex items-center gap-3 ml-6 mt-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
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

        <div className="p-6 space-y-6">
          <div className="bg-slate-200/10 dark:bg-slate-800 rounded-xl p-4 border border-slate-300 dark:border-slate-700">
            <Text
              variant="paragraph"
              className="text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              {t("requestCard.info")}
            </Text>
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold mb-2">
              {t("rules.title")}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>
                  {t("rules.advance")}
                </li>
                <li>
                  {t("rules.duration")}
                </li>
                <li>
                  {t("rules.cancellation")}
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Date Selection */}
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setEndDate(null); // Reset end date when start date changes
              }}
              placeholder={t("form.startDatePlaceholder")}
              minDate={minStartDate}
              disabled={isLoading}
              size="default"
            />
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              placeholder={t("form.endDatePlaceholder")}
              minDate={startDate || minStartDate}
              maxDate={maxEndDate}
              disabled={isLoading || !startDate}
              size="default"
            />
            <Button
              onClick={handleRequestVacation}
              disabled={isLoading || !isValidPeriod || exceedsLimit}
              className="w-full"
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

          {/* Vacation Summary */}
          {isValidPeriod && (
            <div className="bg-linear-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <Text
                    size="sm"
                    className="font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {t("summary.title")}
                  </Text>
                  <Text
                    size="sm"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    {t("summary.daysRequested", { days: vacationDays, count: vacationDays })}
                  </Text>
                </div>
                <div className="text-right">
                  <Text
                    size="sm"
                    className="font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {t("summary.remainingAfter")}
                  </Text>
                  <Text
                    size="sm"
                    className={
                      exceedsLimit
                        ? "text-red-600 dark:text-red-400 font-bold"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {exceedsLimit
                      ? t("summary.exceedsBy", { days: vacationDays - (remainingDays || 0) })
                      : t("summary.remainingDays", { days: (remainingDays || 0) - vacationDays })}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {exceedsLimit && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <Text
                    size="sm"
                    className="font-semibold text-red-700 dark:text-red-300"
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

      {/* Vacation History */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
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

          <TeacherVacationList
            vacations={vacations}
            onDelete={fetchMyVacations}
          />
        </div>
      </Card>
    </div>
  );
}
