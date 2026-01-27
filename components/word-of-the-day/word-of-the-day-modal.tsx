"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getRandomWord } from "@/lib/vocabulary";
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
}

export const WordOfTheDayModal = ({ language }: WordOfTheDayModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wordData, setWordData] = useState<{ word: string; translation: string } | null>(null);

  useEffect(() => {
    async function checkAndFetchWord() {
      console.log("1. Iniciando check. Language recebida:", language);

      if (!language) {
        console.log("2. Abortado: Idioma indefinido.");
        return;
      }

      const lastShown = localStorage.getItem("lastWordOfTheDay");
      const today = new Date().toDateString();
      console.log(`3. Storage: Último visto: ${lastShown} | Hoje: ${today}`);

      // COMENTE ESTA LINHA ABAIXO PARA TESTAR SE FOR O STORAGE
      if (lastShown === today) {
        console.log("4. Abortado: Já visto hoje.");
        return;
      }

      try {
        const data = await getRandomWord(language);
        console.log("5. Dados retornados da API:", data);
        
        if (data) {
          setWordData(data);
          setIsOpen(true);
          localStorage.setItem("lastWordOfTheDay", today);
        } else {
          console.log("6. Falha: getRandomWord retornou null (verifique o arquivo JSON)");
        }
      } catch (error) {
        console.error("Erro ao buscar palavra:", error);
      }
    }

    checkAndFetchWord();
  }, [language]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!wordData) return null;

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        <ModalIcon type="star" />
        <ModalHeader>
          <ModalTitle>Word of the Day</ModalTitle>
          <ModalDescription>
            Here is your word for today to help you learn!
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-primary">{wordData.word}</p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {wordData.translation}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalPrimaryButton onClick={handleClose}>Got it!</ModalPrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};