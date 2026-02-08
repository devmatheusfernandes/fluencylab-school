"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { useTranslations } from "next-intl";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { NoResults } from "../ui/no-results";

interface LearnedItem {
  id: string;
  title: string;
  type: "item" | "structure";
  learnedAt: Date | string;
  srsData?: any;
}

interface LearnedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LearnedItem[];
  loading: boolean;
}

export function LearnedItemsModal({
  isOpen,
  onClose,
  items,
  loading,
}: LearnedItemsModalProps) {
  const t = useTranslations("StudentNotebook");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-2xl h-[70vh] flex flex-col">
        <ModalHeader>
          <ModalTitle>{t("learnedItemsTitle")}</ModalTitle>
          <ModalDescription>{t("learnedItemsDescription")}</ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto h-[calc(80vh-120px)] pb-22">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <SpinnerLoading />
            </div>
          ) : items.length === 0 ? (
            <NoResults
              title={t("noLearnedItemsTitle")}
              description={t("noLearnedItemsDescription")}
            />
          ) : (
            <div className="space-y-3 pb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-base">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("learnedOn")}{" "}
                      {format(new Date(item.learnedAt), "PPP", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  <Badge
                    variant={
                      item.type === "structure" ? "secondary" : "outline"
                    }
                  >
                    {item.type === "structure"
                      ? t("structure")
                      : t("vocabulary")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
