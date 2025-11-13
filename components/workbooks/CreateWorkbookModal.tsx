'use client';
import { useEffect, useState, FormEvent } from "react";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { db, storage } from "@/lib/firebase/config";
import { Workbook } from "@/types/notebooks/notebooks";

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelOptions: Workbook['level'][];
  workbookCollections: string[]; // List of existing workbook names
  onWorkbookCreated: (newWorkbookName: string) => void; // Callback after creating a workbook
}

export default function CreateMaterialModal({
  isOpen,
  onClose,
  levelOptions,
  workbookCollections,
  onWorkbookCreated,
}: CreateMaterialModalProps) {
  // State for Workbook creation
  const [newWorkbookName, setNewWorkbookName] = useState('');
  const [newWorkbookLevel, setNewWorkbookLevel] = useState<string>('');
  const [newWorkbookCoverFile, setNewWorkbookCoverFile] = useState<File | null>(null);
  const [isCreatingWorkbook, setIsCreatingWorkbook] = useState(false);

  // State for Lesson creation
  const [lessonTitle, setLessonTitle] = useState('');
  const [selectedWorkbookForLesson, setSelectedWorkbookForLesson] = useState('');
  const [lessonUnit, setLessonUnit] = useState<number>(0);
  const [lessonLanguage, setLessonLanguage] = useState('');
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('workbook'); // 'workbook' or 'lesson'

  // Initialize form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewWorkbookName('');
      setNewWorkbookLevel(levelOptions[0] || ''); // Default to first level option
      setNewWorkbookCoverFile(null);
      setLessonTitle('');
      setSelectedWorkbookForLesson(workbookCollections[0] || ''); // Default to first existing workbook
      setLessonUnit(0);
      setLessonLanguage('English'); // Default language
      setActiveTab('workbook'); // Default to workbook creation tab
    }
  }, [isOpen, levelOptions, workbookCollections]);

  if (!isOpen) return null;

  const handleCreateWorkbook = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newWorkbookName.trim()) {
      toast.error('O nome da apostila não pode estar vazio.');
      return;
    }
    if (workbookCollections.includes(newWorkbookName)) {
      toast.error('Já existe uma apostila com este nome.');
      return;
    }
    if (!newWorkbookLevel) {
      toast.error('Por favor, selecione um nível para a apostila.');
      return;
    }

    setIsCreatingWorkbook(true);
    let coverURL = "";

    try {
      if (newWorkbookCoverFile) {
        const imageRef = ref(storage, `workbookCovers/${uuidv4()}_${newWorkbookCoverFile.name}`);
        await uploadBytes(imageRef, newWorkbookCoverFile);
        coverURL = await getDownloadURL(imageRef);
      }

      // Create a new document for the workbook in 'Apostilas' collection
      const workbookDocRef = doc(db, "Apostilas", newWorkbookName);
      await setDoc(workbookDocRef, {
        level: newWorkbookLevel,
        coverURL: coverURL,
        guidelines: "", // New workbooks start with empty guidelines
      });

      // Update the 'workbookCollections' document with the new workbook name
      const wbCollectionsRef = doc(db, "Apostilas", "workbookCollections");
      const wbCollectionsSnap = await getDoc(wbCollectionsRef);
      let updatedWorkbooksNames: string[] = [];
      if (wbCollectionsSnap.exists()) {
        updatedWorkbooksNames = wbCollectionsSnap.data().names || [];
      }
      updatedWorkbooksNames.push(newWorkbookName);
      await setDoc(wbCollectionsRef, { names: updatedWorkbooksNames });

      toast.success(`Apostila "${newWorkbookName}" criada com sucesso!`);
      onWorkbookCreated(newWorkbookName); // Notify parent component
      onClose(); // Close the modal after creation
    } catch (error) {
      console.error("Erro ao criar apostila:", error);
      toast.error("Erro ao criar a apostila.");
    } finally {
      setIsCreatingWorkbook(false);
    }
  };

  const handleCreateLesson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedWorkbookForLesson || !lessonUnit || !lessonLanguage) {
      toast.error('Por favor, preencha todos os campos da lição.');
      return;
    }

    setIsCreatingLesson(true);
    try {
      const newNotebook = {
        docID: uuidv4(),
        title: lessonTitle,
        workbook: selectedWorkbookForLesson,
        content: '', // New lessons start with empty content
        unit: lessonUnit,
        language: lessonLanguage,
      };

      await addDoc(collection(db, `Apostilas/${selectedWorkbookForLesson}/Lessons`), newNotebook);

      toast.success(`Lição "${lessonTitle}" criada com sucesso!`);
      onClose(); // Close the modal after creation
    } catch (error) {
      console.error('Erro ao criar lição:', error);
      toast.error('Erro ao criar a lição.');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-300">
            Criar Novo Material
          </h2>
          <button
            onClick={onClose}
            disabled={isCreatingWorkbook || isCreatingLesson}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs for Workbook/Lesson Creation */}
        <div className="p-4">
          <Tabs aria-label="Opções de Criação" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
            <TabsList>
              <TabsTrigger value="workbook">Nova Apostila</TabsTrigger>
              <TabsTrigger value="lesson">Nova Lição</TabsTrigger>
            </TabsList>
            <TabsContent value="workbook">
              <form onSubmit={handleCreateWorkbook} className="space-y-6 p-4">
                <div>
                  <label htmlFor="newWorkbookName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Apostila
                  </label>
                  <Input
                    id="newWorkbookName"
                    placeholder="Ex: Fundamentos de Inglês"
                    value={newWorkbookName}
                    onChange={(e) => setNewWorkbookName(e.target.value)}
                    disabled={isCreatingWorkbook}
                  />
                </div>

                <div>
                  <label htmlFor="newWorkbookLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível
                  </label>
                  <select
                    id="newWorkbookLevel"
                    value={newWorkbookLevel}
                    onChange={(e) => setNewWorkbookLevel(e.target.value)}
                    disabled={isCreatingWorkbook}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione um nível</option>
                    {levelOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="newWorkbookCover" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capa da Apostila
                  </label>
                  <input
                    type="file"
                    id="newWorkbookCover"
                    accept="image/*"
                    onChange={(e) => setNewWorkbookCoverFile(e.target.files ? e.target.files[0] : null)}
                    disabled={isCreatingWorkbook}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                      transition-colors duration-200 cursor-pointer"
                  />
                  {newWorkbookCoverFile && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Arquivo selecionado: <span className="font-medium">{newWorkbookCoverFile.name}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={isCreatingWorkbook}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCreatingWorkbook}
                  >
                    {isCreatingWorkbook ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Criando...
                      </>
                    ) : 'Criar Apostila'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="lesson">
              <form onSubmit={handleCreateLesson} className="space-y-6 p-4 overflow-y-auto h-[60vh]">
                <div>
                  <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Lição
                  </label>
                  <Input
                    id="lessonTitle"
                    placeholder="Ex: Introdução ao Verbo To Be"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    disabled={isCreatingLesson}
                  />
                </div>

                <div>
                  <label htmlFor="selectedWorkbookForLesson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apostila
                  </label>
                  <select
                    id="selectedWorkbookForLesson"
                    onChange={(e) => setSelectedWorkbookForLesson(e.target.value)}
                    value={selectedWorkbookForLesson}
                    disabled={isCreatingLesson}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione uma apostila</option>
                    {workbookCollections.map((workbookName, index) => (
                      <option key={index} value={workbookName}>
                        {workbookName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lessonUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unidade
                  </label>
                  <select
                    id="lessonUnit"
                    onChange={(e) => setLessonUnit(parseInt(e.target.value, 10))}
                    value={lessonUnit}
                    disabled={isCreatingLesson}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione uma unidade</option>
                    {[...Array(20)].map((_, i) => ( // Up to 20 units
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lessonLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma
                  </label>
                  <select
                    id="lessonLanguage"
                    onChange={(e) => setLessonLanguage(e.target.value)}
                    value={lessonLanguage}
                    disabled={isCreatingLesson}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione o idioma</option>
                    <option value="English">English</option>
                    <option value="Español">Español</option>
                    {/* Add more languages as needed */}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={isCreatingLesson}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingLesson}
                  >
                    {isCreatingLesson ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Criando...
                      </>
                    ) : 'Criar Lição'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}