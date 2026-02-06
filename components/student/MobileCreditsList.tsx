import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface MobileCreditsListProps {
  selectedMonth: number | "all";
  selectedYear: number | "all";
  monthOptions: { value: number; label: string }[];
  displayRescheduleInfo: { count: number; limit: number; allowed?: boolean };
  isCurrentMonth: boolean;
  teacherCancellationCredits: number;
  bonusCredits: number;
  lateStudentCredits: number;
  setBookingCreditType: (type: "bonus" | "late_students") => void;
  setIsBookingModalOpen: (isOpen: boolean) => void;
}

export default function MobileCreditsList({
  selectedMonth,
  selectedYear,
  monthOptions,
  displayRescheduleInfo,
  isCurrentMonth,
  teacherCancellationCredits,
  bonusCredits,
  lateStudentCredits,
  setBookingCreditType,
  setIsBookingModalOpen,
}: MobileCreditsListProps) {
  const t = useTranslations("StudentClassesComponent");

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Enhanced Reschedule Card */}
      <Card className="w-full flex flex-col justify-between">
        <Text size="sm" className="font-medium text-subtitle mb-1">
          {selectedMonth === "all" || selectedYear === "all"
            ? t("reschedulesTitle")
            : t("reschedulesMonthTitle", {
                month: monthOptions[selectedMonth as number]?.label,
                year: selectedYear,
              })}
        </Text>
        <Text className="font-bold text-lg">
          {displayRescheduleInfo.count} / {displayRescheduleInfo.limit}
        </Text>
        {!isCurrentMonth &&
          selectedMonth !== "all" &&
          selectedYear !== "all" && (
            <Text size="xs" className="text-subtitle/30 mt-1">
              {t("historyLabel")}
            </Text>
          )}
      </Card>

      {/* Teacher Cancellation Credits Card */}
      <Card className="w-full flex flex-col justify-between">
        <Text size="sm" className="font-medium text-subtitle mb-1">
          {t("creditsTitle")}
        </Text>
        <Text className="font-bold text-lg text-amber-800">
          {teacherCancellationCredits}
        </Text>
        <Text size="xs" className="text-subtitle/30 mt-1">
          {t("creditsDesc")}
        </Text>
      </Card>

      {/* Bonus Credits Card */}
      {bonusCredits > 0 && (
        <Card className="w-full flex flex-col justify-between">
          <div>
            <Text size="sm" className="font-medium text-subtitle mb-1">
              {t("extraCreditsTitle")}
            </Text>
            <div>
              <Text className="font-bold text-lg text-blue-800">
                {bonusCredits}
              </Text>
              <Text size="xs" className="text-subtitle/50">
                {t("bonusLabel")}
              </Text>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                setBookingCreditType("bonus");
                setIsBookingModalOpen(true);
              }}
            >
              Agendar aula
            </Button>
          </div>
        </Card>
      )}

      {/* Late Student Credits Card */}
      {lateStudentCredits > 0 && (
        <Card className="w-full flex flex-col justify-between">
          <div>
            <Text size="sm" className="font-medium text-subtitle mb-1">
              {t("extraCreditsTitle")}
            </Text>
            <div>
              <Text className="font-bold text-lg text-blue-800">
                {lateStudentCredits}
              </Text>
              <Text size="xs" className="text-subtitle/50">
                {t("lateStudentLabel")}
              </Text>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                setBookingCreditType("late_students");
                setIsBookingModalOpen(true);
              }}
            >
              Agendar Aula
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
