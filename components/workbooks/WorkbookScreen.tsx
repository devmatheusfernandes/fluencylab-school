"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import {
  Notebook,
  Workbook,
  OrganizedNotebooks,
} from "@/types/notebooks/notebooks";
import { markdownComponents } from "./MarkdownComponents";
import EditWorkbookModal from "./EditWorkbook";
import CreateMaterialModal from "./CreateWorkbookModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion } from "framer-motion"; // Import motion
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";

const levelOrder = {
  "Primeiros Passos": 1,
  Essencial: 2,
  Mergulho: 3,
  Avançado: 4,
  Específicos: 5,
};

const levelOptions = Object.keys(levelOrder) as Workbook["level"][];

export default function Home() {
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Notebook[]>([]);
  const [organizedNotebooks, setOrganizedNotebooks] =
    useState<OrganizedNotebooks>({});
  const { data: session } = useSession();

  // Fallback para capas que falharem ao carregar
  const [failedCoverIds, setFailedCoverIds] = useState<Record<string, boolean>>({});

  const [workbookCollectionsState, setWorkbookCollectionsState] = useState<
    string[]
  >([]); // You'll need to fetch this
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkbook, setEditingWorkbook] = useState<Workbook | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchWorkbooks() {
      try {
        const workbooksCollection = collection(db, "Apostilas");
        const snapshot = await getDocs(workbooksCollection);
        const fetched: Workbook[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.level && data.coverURL) {
            // Ensure core fields exist
            fetched.push({
              id: docSnap.id,
              title: docSnap.id, // Or data.title if you have a separate title field
              level: data.level,
              coverURL: data.coverURL,
              guidelines: data.guidelines || "", // Fetch guidelines, default to empty string
            });
          }
        });
        setWorkbooks(fetched);
      } catch (error) {
        console.error("Erro ao buscar apostilas:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkbooks();
  }, []);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const notebooksMap = new Map<string, Notebook[]>();

    async function fetchLessons() {
      const snapshotApostilas = await getDocs(collection(db, "Apostilas"));
      snapshotApostilas.forEach((docSnapApostila) => {
        const workbookName = docSnapApostila.id;
        if (workbookName === "workbookCollections") return;

        const lessonsColRef = collection(
          db,
          `Apostilas/${workbookName}/Lessons`
        );
        const unsubscribe = onSnapshot(lessonsColRef, (snapLessons) => {
          const notebooks: Notebook[] = [];
          snapLessons.forEach((docLesson) => {
            const data = docLesson.data() as Omit<
              Notebook,
              "docID" | "workbook"
            >; // Assuming data matches Notebook structure
            notebooks.push({
              ...data,
              docID: docLesson.id,
              workbook: workbookName,
            } as Notebook); // Cast to Notebook
          });
          notebooksMap.set(workbookName, notebooks);

          const combined: Notebook[] = [];
          notebooksMap.forEach((notes) => combined.push(...notes));

          const organized: OrganizedNotebooks = {};
          combined.forEach((note) => {
            if (!organized[note.language]) organized[note.language] = {};
            if (!organized[note.language][note.workbook])
              organized[note.language][note.workbook] = [];
            organized[note.language][note.workbook].push(note);
          });
          setOrganizedNotebooks(organized);
        });
        unsubscribes.push(unsubscribe);
      });
    }
    fetchLessons();
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    // ... (search useEffect - no changes needed here)
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const results: Notebook[] = [];

    for (const lang in organizedNotebooks) {
      for (const workbookName in organizedNotebooks[lang]) {
        for (const lesson of organizedNotebooks[lang][workbookName]) {
          if (lesson.title.toLowerCase().includes(lowerQuery)) {
            results.push(lesson);
          }
        }
      }
    }
    setSearchResults(results);
  }, [searchQuery, organizedNotebooks]);

  useEffect(() => {
    async function fetchWorkbookNames() {
      try {
        const wbDocRef = doc(db, "Apostilas", "workbookCollections");
        const wbDocSnap = await getDoc(wbDocRef);
        if (wbDocSnap.exists()) {
          setWorkbookCollectionsState(wbDocSnap.data().names || []);
        }
      } catch (error) {
        console.error("Error fetching workbook names for modal:", error);
      }
    }
    fetchWorkbookNames();
  }, []); // Empty dependency array to run once on mount

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleWorkbookCreated = (newWorkbookName: string) => {
    // Option 1: Optimistically update the list
    setWorkbookCollectionsState((prev) => [...prev, newWorkbookName]);
    // Option 2 (more robust for larger apps): Re-fetch all workbooks/workbookCollections
    // fetchWorkbooks(); // If you have a function to refetch all workbooks
  };

  const handleOpenEditModal = (workbook: Workbook) => {
    setEditingWorkbook(workbook);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkbook(null);
  };

  const handleSaveChanges = async (
    id: string,
    newLevel: string,
    newGuidelines: string,
    newCoverFile?: File
  ) => {
    const docRef = doc(db, "Apostilas", id);
    let newCoverURL = "";

    if (newCoverFile) {
      const imageRef = ref(
        storage,
        `workbookCovers/${uuidv4()}_${newCoverFile.name}`
      );
      await uploadBytes(imageRef, newCoverFile);
      newCoverURL = await getDownloadURL(imageRef);
    }

    // Firestore requires non-undefined values for updates.
    // Use a flexible type for updates or build the object conditionally.
    const updates: { [key: string]: any } = {};
    if (newLevel) updates.level = newLevel as Workbook["level"];
    if (newCoverURL) updates.coverURL = newCoverURL;
    // Always update guidelines, even if it's an empty string, to allow clearing it.
    updates.guidelines = newGuidelines;

    if (Object.keys(updates).length > 0) {
      await updateDoc(docRef, updates);
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id === id) {
            const updatedWb = { ...wb };
            if (newLevel) updatedWb.level = newLevel as Workbook["level"];
            if (newCoverURL) updatedWb.coverURL = newCoverURL;
            updatedWb.guidelines = newGuidelines;
            return updatedWb;
          }
          return wb;
        })
      );
    } else if (newCoverFile) {
      // Case where only cover was changed, but newCoverURL was set
      // This case should be covered by the above if newCoverURL is set
    }
  };

  const grouped = workbooks.reduce(
    (acc, wb) => {
      if (!acc[wb.level]) acc[wb.level] = [];
      acc[wb.level].push(wb);
      return acc;
    },
    {} as Record<string, Workbook[]>
  );

  const sortedLevels = Object.keys(grouped).sort(
    (a, b) =>
      levelOrder[a as keyof typeof levelOrder] -
      levelOrder[b as keyof typeof levelOrder]
  );

  // Framer Motion variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07, // Stagger children animations
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-[90vh] p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-2 transition-colors duration-300">
        {/* Search Bar */}
        <div className="flex flex-row gap-6 mb-6 w-full">
          <Input
            type="text"
            placeholder="Buscar lições..."
            value={searchQuery}
            className="min-w-full"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {session?.user.role === "admin" && (
            <div className="flex flex-row justify-end gap-2 w-full">
              <Button onClick={handleOpenCreateModal}>Criar</Button>
              <Button variant="glass" onClick={() => router.push("blog")}>
                Criar Post
              </Button>
              <Button variant="glass" onClick={() => router.push("podcast")}>
                Criar Podcast
              </Button>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <motion.div
            className="mb-12"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Resultados da busca ({searchResults.length})
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((lesson) => (
                  <motion.li
                    key={lesson.docID}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Link
                      href={{
                        pathname: "workbooks/Apostila",
                        query: {
                          book: lesson.workbook,
                          lesson: lesson.docID,
                          workbook: lesson.workbook,
                        },
                      }}
                      className="block p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {lesson.workbook} – {lesson.language}
                          </p>
                        </div>
                        <svg
                          className="h-5 w-5 text-gray-400 dark:text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : (
          // Grouped Workbooks
          sortedLevels.map((level) => (
            <motion.div
              key={level}
              className="mb-12"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white border-b pb-2 border-gray-300 dark:border-gray-600">
                {level}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {grouped[level].map((workbook) => (
                  <motion.div
                    key={workbook.id}
                    className="relative group bg-white dark:bg-gray-800 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                    variants={itemVariants}
                    whileHover={{
                      scale: 1.05,
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    }} // Add hover effect
                  >
                    <Link
                      href={{
                        pathname: "workbooks/Apostila",
                        query: { book: workbook.id },
                      }}
                      className="block flex-grow"
                    >
                      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-200 relative overflow-hidden">
                        {(!failedCoverIds[workbook.id] && !!workbook.coverURL) ? (
                          <Image
                            priority
                            width={400}
                            height={400}
                            src={workbook.coverURL}
                            alt={workbook.title}
                            className="w-full h-full object-cover ease-in-out transform-all duration-500 group-hover:contrast-125"
                            onError={() =>
                              setFailedCoverIds((prev) => ({ ...prev, [workbook.id]: true }))
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-center p-4 text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p className="text-sm">Capa indisponível</p>
                          </div>
                        )}
                      </div>
                    </Link>
                    {session?.user.role === "admin" && (
                      <div className="p-4 flex flex-row items-center justify-between">
                        <div className="flex flex-col items-start">
                          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {workbook.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {workbook.level}
                          </p>
                        </div>
                        <Edit
                          onClick={() => handleOpenEditModal(workbook)}
                          className="text-3xl text-gray-500 dark:text-gray-400 hover:text-primary duration-300 ease-in-out cursor-pointer"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}

        {/* No Workbooks Found */}
        {searchQuery.length === 0 && sortedLevels.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma apostila encontrada
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Parece que não há apostilas disponíveis no momento.
            </p>
          </div>
        )}
      </div>

      <CreateMaterialModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        levelOptions={levelOptions} // Pass your defined levelOptions from Home
        workbookCollections={workbookCollectionsState}
        onWorkbookCreated={handleWorkbookCreated}
      />

      {/* Modal Render */}
      <EditWorkbookModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        workbook={editingWorkbook}
        onSave={handleSaveChanges}
        levelOptions={levelOptions}
        markdownComponents={markdownComponents}
      />
    </>
  );
}
