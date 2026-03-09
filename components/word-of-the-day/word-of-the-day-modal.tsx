"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { getRandomWord } from "@/lib/learning/vocabulary";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalPrimaryButton,
  ModalIcon,
} from "@/components/ui/modal";

interface WordOfTheDayModalProps {
  language?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DailyWordStorage {
  date: string;
  data: { word: string; translation: string };
}

export const WordOfTheDayModal = ({
  language,
  isOpen: controlledIsOpen,
  onOpenChange,
}: WordOfTheDayModalProps) => {
  const t = useTranslations("WordOfTheDay");
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [wordData, setWordData] = useState<{
    word: string;
    translation: string;
  } | null>(null);

  const isFetchingRef = useRef(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  useEffect(() => {
    async function checkAndFetchWord() {
      if (!language) return;

      const today = new Date().toDateString();
      const storageKey = `wordOfTheDay_${language}`;
      const storedItem = localStorage.getItem(storageKey);

      if (storedItem) {
        try {
          const parsedItem: DailyWordStorage = JSON.parse(storedItem);
          if (parsedItem.date === today) {
            setWordData(parsedItem.data);
            return;
          }
        } catch (e) {
          localStorage.removeItem(storageKey);
        }
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const data = await getRandomWord(language);

        const currentStored = localStorage.getItem(storageKey);
        if (currentStored) {
          try {
            const parsed = JSON.parse(currentStored);
            if (parsed.date === today) {
              setWordData(parsed.data);
              return;
            }
          } catch (e) {}
        }

        if (data) {
          setWordData(data);
          if (!isControlled) {
            setInternalIsOpen(true);
          }

          const newStorageItem: DailyWordStorage = {
            date: today,
            data: data,
          };
          localStorage.setItem(storageKey, JSON.stringify(newStorageItem));
        }
      } catch (error) {
      } finally {
        isFetchingRef.current = false;
      }
    }

    checkAndFetchWord();
  }, [language]);

  const handleClose = () => {
    handleOpenChange(false);
  };

  if (!wordData) return null;

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        <ModalIcon type="star" />
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
          <ModalDescription>{t("description")}</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-primary">{wordData.word}</p>
            <p className="hidden text-lg text-gray-600 dark:text-gray-400">
              {wordData.translation}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalPrimaryButton onClick={handleClose}>
            {t("gotIt")}
          </ModalPrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
