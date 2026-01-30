"use client";
import { useState, useEffect, useRef } from "react";
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
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Interface para o que vamos salvar no Storage
interface DailyWordStorage {
  date: string;
  data: { word: string; translation: string };
}

export const WordOfTheDayModal = ({ language, isOpen: controlledIsOpen, onOpenChange }: WordOfTheDayModalProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [wordData, setWordData] = useState<{ word: string; translation: string } | null>(null);
  
  // Ref para evitar execução dupla estrita (Race condition lock)
  const isFetchingRef = useRef(false);

  // Determine effective open state
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
      const storageKey = `wordOfTheDay_${language}`; // Chave única por idioma
      const storedItem = localStorage.getItem(storageKey);

      // 1. VERIFICAÇÃO INTELIGENTE:
      // Se já temos dados salvos E a data é de hoje, usamos o cache.
      if (storedItem) {
        try {
          const parsedItem: DailyWordStorage = JSON.parse(storedItem);
          if (parsedItem.date === today) {
            console.log("Recuperado do cache (não mostra modal novamente se já fechou, ou mostra se quiser persistir a lógica visual):");
            setWordData(parsedItem.data);
            // NÃO abrimos automaticamente se já estava no cache (já viu hoje)
            return; 
          }
        } catch (e) {
          console.error("Erro ao ler storage, limpando...", e);
          localStorage.removeItem(storageKey);
        }
      }

      // Evita chamadas duplicadas simultâneas (React Strict Mode)
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        console.log("Buscando nova palavra na API...");
        const data = await getRandomWord(language);
        
        if (data) {
          setWordData(data);
          // Se for uma nova palavra, abrimos automaticamente (apenas se não controlado)
          if (!isControlled) {
            setInternalIsOpen(true);
          }
          
          // 2. SALVAR O OBJETO COMPLETO:
          const newStorageItem: DailyWordStorage = {
            date: today,
            data: data
          };
          localStorage.setItem(storageKey, JSON.stringify(newStorageItem));
        }
      } catch (error) {
        console.error("Erro ao buscar palavra:", error);
      } finally {
        isFetchingRef.current = false;
      }
    }

    checkAndFetchWord();
  }, [language]); // isControlled is stable enough or ignored in deps to prevent loop

  const handleClose = () => {
    handleOpenChange(false);
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
            <p className="hidden text-lg text-gray-600 dark:text-gray-400">
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
