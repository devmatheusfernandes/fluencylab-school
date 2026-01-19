"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { LearningItem, LearningStructure, GrammaticalRole } from "@/types/lesson";
import { updateLearningItem, updateLearningStructure } from "@/actions/lesson-updating";
import { handleImageUpload, deleteImageByUrl } from "@/lib/tiptap-utils";
import { toast } from "sonner";
import Image from "next/image";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalTrigger, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Eye, Volume2, Loader2, Upload, X, Edit, Layers, BookOpen, BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonComponentsManagerProps {
  vocabulary: LearningItem[];
  structures: LearningStructure[];
}

export default function LessonComponentsManager({ vocabulary, structures }: LessonComponentsManagerProps) {
  const t = useTranslations("LessonComponentsManager");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="vocabulary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="vocabulary">
            {t("tabs.vocabulary", { count: vocabulary.length })}
          </TabsTrigger>
          <TabsTrigger value="structures">
            {t("tabs.structures", { count: structures.length })}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vocabulary" className="mt-6">
           <VocabularyList items={vocabulary} />
        </TabsContent>
        
        <TabsContent value="structures" className="mt-6">
           <StructuresList items={structures} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VocabularyList({ items }: { items: LearningItem[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const t = useTranslations("LessonComponentsManager");

  const levels = Array.from(new Set(items.map((i) => i.level))).sort();
  const types = Array.from(new Set(items.map((i) => i.type))).sort();
  const languages = Array.from(new Set(items.map((i) => i.language))).sort();

  const filteredItems = items.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      term.length === 0 ||
      item.mainText.toLowerCase().includes(term) ||
      item.meanings.some(
        (m) =>
          m.translation.toLowerCase().includes(term) ||
          m.definition.toLowerCase().includes(term)
      );

    const matchesLevel =
      levelFilter === "all" || item.level === levelFilter;
    const matchesType =
      typeFilter === "all" || item.type === typeFilter;
    const matchesLanguage =
      languageFilter === "all" || item.language === languageFilter;

    return matchesSearch && matchesLevel && matchesType && matchesLanguage;
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-medium">
          {t("empty.vocabularyTitle")}
        </h3>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t("filters.searchVocabularyPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3"
          />
          <Select
            value={languageFilter}
            onValueChange={setLanguageFilter}
          >
            <SelectTrigger className="w-full md:w-[130px]">
              <SelectValue placeholder={t("filters.languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filters.allLanguages")}
              </SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={levelFilter}
            onValueChange={setLevelFilter}
          >
            <SelectTrigger className="w-full md:w-[130px]">
              <SelectValue placeholder={t("filters.levelPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filters.allLevels")}
              </SelectItem>
              {levels.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t("filters.typePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filters.allTypes")}
              </SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.term")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.level")}</TableHead>
                <TableHead>{t("table.mainTranslation")}</TableHead>
                <TableHead className="text-right">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {item.mainText}
                      </span>
                      {item.phonetic && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.phonetic}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.level}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.meanings[0]?.translation}
                  </TableCell>
                  <TableCell className="text-right">
                    <ItemDetailModal item={item} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StructuresList({ items }: { items: LearningStructure[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const t = useTranslations("LessonComponentsManager");

  const levels = Array.from(new Set(items.map((i) => i.level))).sort();
  const types = Array.from(new Set(items.map((i) => i.type))).sort();

  const filteredItems = items.filter((struct) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      term.length === 0 ||
      struct.sentences.some((s) =>
        s.whole_sentence.toLowerCase().includes(term)
      );

    const matchesLevel =
      levelFilter === "all" || struct.level === levelFilter;
    const matchesType =
      typeFilter === "all" || struct.type === typeFilter;

    return matchesSearch && matchesLevel && matchesType;
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-medium">
          {t("empty.structuresTitle")}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t("filters.searchStructuresPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3"
        />
        <Select
          value={levelFilter}
          onValueChange={setLevelFilter}
        >
          <SelectTrigger className="w-full md:w-[130px]">
            <SelectValue placeholder={t("filters.levelPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("filters.allLevels")}
            </SelectItem>
            {levels.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>
                {lvl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t("filters.typePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("filters.allTypes")}
            </SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredItems.map((struct) => (
          <Card key={struct.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base font-medium font-mono bg-card px-2 py-1 rounded w-fit">
                  {struct.type}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                      {t("structure.levelLabel", { level: struct.level })}
                </span>
              </div>
              <StructureDetailModal structure={struct} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                {struct.sentences.map((sent, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/30 rounded border text-sm"
                  >
                    <p className="font-medium mb-2">{sent.whole_sentence}</p>
                    <div className="flex flex-wrap gap-2">
                      {sent.order
                        .sort((a, b) => a.order - b.order)
                        .map((w, wIdx) => (
                          <div
                            key={wIdx}
                            className="flex flex-col items-center bg-accent border px-2 py-1 rounded"
                          >
                            <span className="font-bold">{w.word}</span>
                            <span className="text-[10px] text-blue-600 uppercase tracking-tighter">
                              {w.role || "?"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * MODAL: Item Detail (Vocabulary)
 * -----------------------------------------------------------------------------------------------*/
function ItemDetailModal({ item }: { item: LearningItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningItem>>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
   const t = useTranslations("LessonComponentsManager");

  const handleInputChange = (field: keyof LearningItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMeaningChange = (index: number, field: string, value: string) => {
    const newMeanings = [...(formData.meanings || [])];
    newMeanings[index] = { ...newMeanings[index], [field]: value } as any;
    setFormData((prev) => ({ ...prev, meanings: newMeanings }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await handleImageUpload(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success(t("vocabulary.imageUploadSuccess"));
    } catch (error) {
      toast.error(t("vocabulary.imageUploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.imageUrl) return;
    if (confirm(t("vocabulary.confirmRemoveImage"))) {
      try {
        await deleteImageByUrl(formData.imageUrl);
        setFormData((prev) => ({ ...prev, imageUrl: null }));
        toast.success(t("vocabulary.imageRemoveSuccess"));
      } catch (error) {
        toast.error(t("vocabulary.imageRemoveError"));
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (item.imageUrl && formData.imageUrl !== item.imageUrl) {
        await deleteImageByUrl(item.imageUrl);
      }
      const result = await updateLearningItem(item.id, formData);
      if (result.success) {
        toast.success(t("vocabulary.updateSuccess"));
        setIsEditing(false);
      } else {
        toast.error(t("vocabulary.updateError"));
      }
    } catch (error) {
      toast.error(t("vocabulary.updateUnknownError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={undefined} onOpenChange={(open) => { if(!open) setIsEditing(false); }}>
      <ModalTrigger asChild>
        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
      </ModalTrigger>
      <ModalContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
            {isEditing ? (
                 <Input value={formData.mainText} onChange={e => handleInputChange("mainText", e.target.value)} className="font-bold text-xl" />
            ) : (
                 <h2 className="text-xl font-bold">{item.mainText}</h2>
            )}
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          {t("structure.cancel")}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                            {t("structure.save")}
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2"/>
                      {t("structure.enableEditing")}
                    </Button>
                )}
            </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
            {/* Image Section */}
            <div className="mb-6 space-y-2">
                <h4 className="text-xs font-bold uppercase text-gray-500">
                  {t("vocabulary.sectionImage")}
                </h4>
                {isEditing ? (
                    <div className="border border-dashed p-4 rounded-lg flex items-center gap-4">
                        {formData.imageUrl ? (
                            <div className="relative w-24 h-24">
                                <Image src={formData.imageUrl} alt="Preview" fill className="object-cover rounded" />
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveImage}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                            {t("vocabulary.noImage")}
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                                {t("vocabulary.upload")}
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                        </div>
                    </div>
                ) : (
                    item.imageUrl ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                            <Image src={item.imageUrl} alt={item.mainText} fill className="object-cover" />
                        </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("vocabulary.noImage")}
                      </p>
                    )
                )}
            </div>

            {/* Meanings */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-500">
                  {t("vocabulary.meanings")}
                </h4>
                {(isEditing ? formData.meanings : item.meanings)?.map((meaning, idx) => (
                    <div key={idx} className="p-4 bg-card/70 rounded border space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <label className="text-xs text-gray-400">
                                  {t("vocabulary.context")}
                                </label>
                                {isEditing ? (
                                    <Input value={meaning.context} onChange={e => handleMeaningChange(idx, 'context', e.target.value)} className="h-8" />
                                ) : <p className="text-sm font-medium">{meaning.context}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">
                                  {t("vocabulary.translation")}
                                </label>
                                {isEditing ? (
                                    <Input value={meaning.translation} onChange={e => handleMeaningChange(idx, 'translation', e.target.value)} className="h-8 font-bold" />
                                ) : <p className="text-sm font-bold">{meaning.translation}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">
                                  {t("vocabulary.definition")}
                                </label>
                                {isEditing ? (
                                    <Input value={meaning.definition} onChange={e => handleMeaningChange(idx, 'definition', e.target.value)} className="h-8" />
                                ) : <p className="text-sm">{meaning.definition}</p>}
                            </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <label className="text-xs text-gray-400">
                              {t("vocabulary.example")}
                            </label>
                            {isEditing ? (
                                <Input value={meaning.example} onChange={e => handleMeaningChange(idx, 'example', e.target.value)} className="h-8 italic mb-1" />
                            ) : <p className="text-sm italic">"{meaning.example}"</p>}
                            {isEditing ? (
                                <Input
                                  value={meaning.exampleTranslation}
                                  onChange={e => handleMeaningChange(idx, "exampleTranslation", e.target.value)}
                                  className="h-8 text-gray-500"
                                />
                            ) : (
                              <p className="text-sm text-gray-500">
                                {meaning.exampleTranslation}
                              </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </ModalContent>
    </Modal>
  );
}

/* -------------------------------------------------------------------------------------------------
 * MODAL: Structure Detail (Grammar)
 * -----------------------------------------------------------------------------------------------*/
function StructureDetailModal({ structure }: { structure: LearningStructure }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LearningStructure>(structure);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations("LessonComponentsManager");

  const roles: GrammaticalRole[] = [
    'subject', 'verb', 'object', 'indirect_object', 'adjective', 'adverb', 
    'preposition', 'auxiliary', 'modal', 'connector', 'article', 'other'
  ];

  const handleSentenceChange = (idx: number, field: string, value: string) => {
    const newSentences = [...formData.sentences];
    (newSentences[idx] as any)[field] = value;
    setFormData(prev => ({ ...prev, sentences: newSentences }));
  };

  const handleWordRoleChange = (sIdx: number, wIdx: number, role: GrammaticalRole) => {
    const newSentences = [...formData.sentences];
    newSentences[sIdx].order[wIdx].role = role;
    setFormData(prev => ({ ...prev, sentences: newSentences }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await updateLearningStructure(structure.id, formData);
      if (result.success) {
        toast.success(t("structure.updateSuccess"));
        setIsEditing(false);
      } else {
        toast.error(t("structure.updateError"));
      }
    } catch (error) {
      toast.error(t("structure.updateUnknownError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={undefined} onOpenChange={(open) => { if(!open) setIsEditing(false); }}>
      <ModalTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          {t("structure.enableEditing")}
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
        <ModalHeader className="px-6 py-4 border-b">
           <ModalTitle className="flex justify-between items-center w-full">
              <span>
                {t("structure.editTitle", { type: structure.type })}
              </span>
              {isEditing ? (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      {t("structure.cancel")}
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                        {t("structure.save")}
                    </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  {t("structure.enableEditing")}
                </Button>
              )}
           </ModalTitle>
        </ModalHeader>
        
        <ScrollArea className="flex-1 p-6">
           <div className="space-y-6">
              {formData.sentences.map((sent, sIdx) => (
                 <div key={sIdx} className="p-4 border rounded-lg bg-card/70">
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          {t("structure.fullSentence")}
                        </label>
                        {isEditing ? (
                             <Input value={sent.whole_sentence} onChange={e => handleSentenceChange(sIdx, 'whole_sentence', e.target.value)} />
                        ) : <p className="font-medium text-lg">{sent.whole_sentence}</p>}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                          {t("structure.analysisLabel")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {sent.order.sort((a,b) => a.order - b.order).map((wordObj, wIdx) => (
                               <div key={wIdx} className="bg-accent border p-2 rounded min-w-[100px] flex flex-col gap-1">
                                   <span className="font-bold text-center border-b pb-1">{wordObj.word}</span>
                                   {isEditing ? (
                                       <Select 
                                         value={wordObj.role || 'other'} 
                                         onValueChange={(val) => handleWordRoleChange(sIdx, wIdx, val as GrammaticalRole)}
                                       >
                                         <SelectTrigger className="h-6 text-[10px]">
                                            <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                         </SelectContent>
                                       </Select>
                                   ) : (
                                       <span className="text-[10px] text-center text-blue-600 uppercase font-bold">
                                         {wordObj.role || "N/A"}
                                       </span>
                                   )}
                                  <span className="text-[10px] text-gray-400 text-center">
                                    {t("structure.positionLabel", { order: wordObj.order })}
                                  </span>
                               </div>
                           ))}
                        </div>
                    </div>
                 </div>
              ))}
           </div>
        </ScrollArea>
      </ModalContent>
    </Modal>
  );
}
