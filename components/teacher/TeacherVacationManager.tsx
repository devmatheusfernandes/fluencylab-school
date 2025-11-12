"use client";

import { useEffect, useState } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Text } from "../ui/text";
import { Calendar } from "lucide-react";
import { Card } from "../ui/card";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import DatePicker from "../ui/date-picker";
import TeacherVacationList from "./TeacherVacationList";

export default function TeacherVacationManager() {
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

  return (
    <div className="mt-4 mx-auto space-y-8">
      {/* Vacation Status Card */}
      <Card className="bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Text className="font-bold text-blue-900 dark:text-blue-100">
                Saldo de Férias
              </Text>
              <Text size="sm" className="text-blue-600 dark:text-blue-300">
                Período atual disponível
              </Text>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-slate-900/50 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <Text
                size="lg"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                Você tem{" "}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {remainingDays}
                </span>{" "}
                dias de férias restantes
              </Text>
              <div className="text-4xl">🏖️</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vacation Request Form */}
      <Card>
        <div className="flex items-center gap-3 ml-6 mt-4">
          <div className="p-2 bg-primary/10 dark:bg-slate-800 rounded-lg">
            <Calendar className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <Text
              size="lg"
              className="font-bold text-slate-900 dark:text-slate-100"
            >
              Solicitar Férias
            </Text>
            <Text size="sm" className="text-slate-600 dark:text-slate-400">
              Suas solicitações anteriores e atuais
            </Text>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-200/10 dark:bg-slate-800 rounded-xl p-4 border border-slate-300 dark:border-slate-700">
            <Text
              variant="subtitle"
              className="text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              Selecione o período em que estará ausente. Todas as aulas
              agendadas neste intervalo serão marcadas como Férias e os alunos
              serão notificados automaticamente.
            </Text>
          </div>

          {/* Date Selection */}
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              placeholder="Selecione a data de início"
              minDate={new Date()}
              disabled={isLoading}
              size="default"
            />
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              placeholder="Selecione a data de término"
              minDate={startDate || new Date()}
              disabled={isLoading}
              size="default"
            />
            <Button
              onClick={handleRequestVacation}
              disabled={isLoading || !isValidPeriod || exceedsLimit}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Solicitar Férias
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
                    Resumo do Período
                  </Text>
                  <Text
                    size="sm"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    {vacationDays} {vacationDays === 1 ? "dia" : "dias"} de
                    férias solicitados
                  </Text>
                </div>
                <div className="text-right">
                  <Text
                    size="sm"
                    className="font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    Restante após solicitação
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
                      ? `Excede em ${vacationDays - (remainingDays || 0)} dias`
                      : `${(remainingDays || 0) - vacationDays} dias restantes`}
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
                    Período inválido
                  </Text>
                  <Text size="sm" className="text-red-600 dark:text-red-400">
                    O período solicitado excede seus dias de férias disponíveis.
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
            <div className="p-2 bg-white/10 dark:bg-slate-800 rounded-lg">
              <Calendar className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <Text
                size="lg"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                Histórico de Férias
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                Suas solicitações anteriores e atuais
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
