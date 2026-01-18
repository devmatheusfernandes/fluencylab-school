"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lesson } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { createLesson } from "@/actions/lesson-processing";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "lessons"), orderBy("metadata.updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Lesson[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({ 
          id: doc.id, 
          ...data,
          // Handle potential timestamp issues safely
          metadata: {
            ...data.metadata,
            updatedAt: data.metadata?.updatedAt 
          }
        } as Lesson);
      });
      setLessons(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!newTitle) return toast.error("Título é obrigatório");
    
    setCreating(true);
    try {
      // createLesson(title, language, contentHtml?, audioUrl?)
      const res = await createLesson(newTitle, newLang);
      
      if (res.success && res.id) {
        toast.success("Aula criada!");
        setIsCreateOpen(false);
        setNewTitle("");
        router.push(`/hub/material-manager/lessons/${res.id}`);
      } else {
        toast.error("Erro ao criar aula.");
      }
    } catch (e) {
      toast.error("Erro no servidor.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Aulas</h1>
          <p className="text-gray-500">Crie, edite e processe conteúdo de aulas.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Aula
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
           <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500">Nenhuma aula encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(lesson => (
            <div 
              key={lesson.id} 
              className="bg-white p-6 rounded-xl border hover:shadow-md transition cursor-pointer flex flex-col gap-4 group relative overflow-hidden"
              onClick={() => router.push(`/hub/material-manager/lessons/${lesson.id}`)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition" />
              
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${
                  lesson.status === 'ready' ? 'bg-green-100 text-green-700' : 
                  lesson.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                  lesson.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {lesson.status}
                </span>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition">{lesson.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {lesson.language === 'en' ? 'Inglês' : 'Português'} • {lesson.level || 'Nível ?'}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t text-xs text-gray-400 flex justify-between items-center">
                 <span className="flex items-center gap-1">
                   {(lesson.learningItensQueue?.length || 0) + (lesson.learningStructuresQueue?.length || 0)} items
                 </span>
                 <span>{formatDate(lesson.metadata?.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <ModalContent>
          <ModalHeader title="Nova Aula" />
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                placeholder="Ex: Introdução ao Present Perfect" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Idioma Base</label>
              <Select value={newLang} onValueChange={setNewLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">Inglês (Alvo)</SelectItem>
                  <SelectItem value="pt">Português (Alvo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Aula
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
