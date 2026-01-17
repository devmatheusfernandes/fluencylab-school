"use client";

import { useState, useMemo, useRef } from "react";
import { LearningItem } from "@/types/content";
import { updateLearningItem } from "@/actions/learning-items";
import { handleImageUpload, deleteImageByUrl } from "@/lib/tiptap-utils";
import { toast } from "sonner";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Eye,
  Volume2,
  FilterX,
  BookOpen,
  Layers,
  Settings,
  Loader2,
  Upload,
  X,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Header } from "@/components/ui/header";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { CreateContentSetModal } from "./CreateContentSetModal";

interface LearningItemsListProps {
  items: LearningItem[];
  isLoading?: boolean;
}

// Componente para badge de nível com cores consistentes
const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    A1: "bg-emerald-100 text-emerald-700 border-emerald-200",
    A2: "bg-emerald-100 text-emerald-700 border-emerald-200",
    B1: "bg-blue-100 text-blue-700 border-blue-200",
    B2: "bg-blue-100 text-blue-700 border-blue-200",
    C1: "bg-purple-100 text-purple-700 border-purple-200",
    C2: "bg-pink-100 text-pink-700 border-pink-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-semibold", colors[level] || "bg-gray-100")}
    >
      {level}
    </Badge>
  );
};

export function LearningItemsList({
  items: initialItems,
  isLoading = false,
}: LearningItemsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Extrair valores únicos para os filtros
  const uniqueLanguages = useMemo(
    () =>
      Array.from(new Set(initialItems.map((i) => i.language).filter(Boolean))),
    [initialItems]
  );
  const uniqueLevels = useMemo(
    () =>
      Array.from(
        new Set(initialItems.map((i) => i.level).filter(Boolean))
      ).sort(),
    [initialItems]
  );
  const uniqueTypes = useMemo(
    () =>
      Array.from(
        new Set(initialItems.map((i) => i.type).filter(Boolean))
      ).sort(),
    [initialItems]
  );

  // Lógica de Filtragem
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchesSearch =
        item.mainText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meanings.some((m) =>
          m.translation.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesLanguage =
        selectedLanguage === "all" || item.language === selectedLanguage;
      const matchesLevel =
        selectedLevel === "all" || item.level === selectedLevel;
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesLanguage && matchesLevel && matchesType;
    });
  }, [initialItems, searchTerm, selectedLanguage, selectedLevel, selectedType]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLanguage("all");
    setSelectedLevel("all");
    setSelectedType("all");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedLanguage !== "all" ||
    selectedLevel !== "all" ||
    selectedType !== "all";

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredItems.length &&
      filteredItems.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- SKELETON LOADING VIEW ---
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex gap-4 flex-wrap">
            <Skeleton className="h-10 w-full sm:w-[200px]" />
            <Skeleton className="h-10 w-full sm:w-[150px]" />
            <Skeleton className="h-10 w-full sm:w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- MAIN COMPONENT ---
  return (
    <Card className="p-4 md:p-8 space-y-8 border-none! bg-transparent!">
      <CardHeader>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Header
              heading="Vocabulary List"
              subheading="Manage and review your learning progress."
              icon={
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" className="ml-2">
                    {filteredItems.length}
                  </Badge>
                </div>
              }
              className="w-full"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              >
                <FilterX className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filters Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full pb-2s">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search word or meaning..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {uniqueLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateContentSetModal
              selectedItemIds={selectedIds}
              trigger={
                <Button variant="outline">
                  <Layers className="mr-2 h-4 w-4" />
                  {selectedIds.length > 0
                    ? `Create Set (${selectedIds.length})`
                    : "Create Set"}
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No vocabulary found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Try adjusting your filters or search terms.
            </p>
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedIds.length === filteredItems.length &&
                          filteredItems.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Word</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Main Meaning</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => (
                      <MotionTableRow
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={
                          selectedIds.includes(item.id) ? "bg-muted/50" : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-base text-foreground font-semibold">
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
                          <Badge
                            variant="secondary"
                            className="uppercase text-[10px] tracking-wider"
                          >
                            {item.language}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <LevelBadge level={item.level} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {item.meanings[0]?.translation}
                        </TableCell>
                        <TableCell className="text-right">
                          <DetailModal item={item} />
                        </TableCell>
                      </MotionTableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* MOBILE VIEW: Grid of Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selected
                </span>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedIds.length === filteredItems.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        selectedIds.includes(item.id) && "border-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-3">
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={() => toggleSelect(item.id)}
                              className="mt-1"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">
                                  {item.mainText}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase"
                                >
                                  {item.language}
                                </Badge>
                              </div>
                              {item.phonetic && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {item.phonetic}
                                </span>
                              )}
                            </div>
                          </div>
                          <DetailModal item={item} />
                        </div>

                        <div className="flex gap-2 mb-3 ml-8">
                          <LevelBadge level={item.level} />
                          <Badge variant="outline">{item.type}</Badge>
                        </div>

                        <div className="text-sm text-muted-foreground border-t pt-2 mt-2 ml-8">
                          <span className="font-medium text-foreground">
                            Meaning:{" "}
                          </span>
                          {item.meanings[0]?.translation}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Wrapper to animate table rows properly
const MotionTableRow = motion(TableRow);

// Extracted Modal for clearer code
function DetailModal({ item }: { item: LearningItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningItem>>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof LearningItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMeaningChange = (index: number, field: string, value: string) => {
    const newMeanings = [...(formData.meanings || [])];
    newMeanings[index] = { ...newMeanings[index], [field]: value };
    setFormData((prev) => ({ ...prev, meanings: newMeanings }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await handleImageUpload(file);

      // If there was a previous image and it's different, we might want to delete it
      // But we only delete on "Save" or explicit delete to avoid losing images on cancel
      // Actually, for better UX, let's just update the state and handle cleanup on save/cancel logic if needed
      // Ideally, we delete the old image immediately if it was just uploaded in this session,
      // but if it's the committed image, we wait for save.
      // For simplicity: just set the new URL.
      // Cleanup of unused images is a separate maintenance task or we can do it if we are sure.

      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.imageUrl) return;

    // If it's a newly uploaded image (not saved yet), we could delete it directly.
    // If it's the original image, we might want to wait until "Save" to delete it from storage?
    // Current requirement: "Remover imagem do storage ao deletar imagem de item com confirmação"

    if (
      confirm(
        "Are you sure you want to remove this image? This cannot be undone."
      )
    ) {
      try {
        await deleteImageByUrl(formData.imageUrl);
        setFormData((prev) => ({ ...prev, imageUrl: null }));
        toast.success("Image removed");
      } catch (error) {
        toast.error("Failed to remove image");
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // If the image URL changed and the original item had a DIFFERENT image URL,
      // we should delete the old one to keep storage clean.
      if (item.imageUrl && formData.imageUrl !== item.imageUrl) {
        // The user replaced the image. We should delete the old one.
        // Note: We already handle explicit delete in handleRemoveImage.
        // This is for when they upload a NEW one directly over the old one.
        await deleteImageByUrl(item.imageUrl);
      }

      const result = await updateLearningItem(item.id, formData);
      if (result.success) {
        toast.success("Item updated successfully");
        setIsEditing(false);
      } else {
        toast.error("Failed to update item: " + result.error);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(item);
    setIsEditing(false);
  };

  return (
    <Modal
      open={undefined}
      onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false);
          setFormData(item);
        }
      }}
    >
      <ModalTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </ModalTrigger>
      <ModalContent
        showHandle={false}
        className="bg-black! max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-full">
              {isEditing ? (
                <div className="flex gap-2 items-center w-full">
                  <Input
                    value={formData.mainText}
                    onChange={(e) =>
                      handleInputChange("mainText", e.target.value)
                    }
                    className="text-2xl font-bold h-10 w-1/2"
                  />
                  <Input
                    value={formData.phonetic || ""}
                    onChange={(e) =>
                      handleInputChange("phonetic", e.target.value)
                    }
                    placeholder="Phonetic"
                    className="font-mono h-10 w-1/4"
                  />
                </div>
              ) : (
                <h2 className="flex items-center gap-3 text-3xl font-bold text-primary">
                  {item.mainText}
                  <Badge
                    variant="secondary"
                    className="text-sm font-normal uppercase align-middle"
                  >
                    {item.language}
                  </Badge>
                </h2>
              )}

              <div className="flex items-center gap-3 mt-2">
                {!isEditing && item.phonetic && (
                  <div className="text-muted-foreground flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md text-sm font-mono">
                    {item.phonetic}
                    <Volume2 className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
                  </div>
                )}
                <Badge variant="outline">{item.type}</Badge>
                <LevelBadge level={item.level} />

                <div className="flex-1" />

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 mt-2">
            {/* Image Section */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
                Illustration
              </h4>
              {isEditing ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg border-dashed bg-muted/20">
                  {formData.imageUrl ? (
                    <div className="relative group">
                      <div className="relative h-32 w-32 rounded-md overflow-hidden border">
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-md border border-dashed flex items-center justify-center bg-muted/30 text-muted-foreground">
                      <span className="text-xs">No image</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 5MB. Supports JPG, PNG, WEBP.
                    </p>
                  </div>
                </div>
              ) : item.imageUrl ? (
                <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                  <Image
                    src={item.imageUrl}
                    alt={item.mainText}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No image available.
                </p>
              )}
            </div>

            {/* Forms Section */}
            {item.forms && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3 w-3" />
                  Conjugations / Forms
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(item.forms).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {key}
                      </span>
                      <span className="font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meanings Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
                Meanings & Contexts
              </h4>
              {(isEditing ? formData.meanings : item.meanings)?.map(
                (meaning, index) => (
                  <div
                    key={index}
                    className="space-y-3 pb-4 border-b border-dashed last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1 shrink-0" variant="secondary">
                        {meaning.context}
                      </Badge>
                      <div className="space-y-1 w-full">
                        {isEditing ? (
                          <>
                            <Input
                              value={meaning.translation}
                              onChange={(e) =>
                                handleMeaningChange(
                                  index,
                                  "translation",
                                  e.target.value
                                )
                              }
                              className="font-bold"
                              placeholder="Translation"
                            />
                            <Textarea
                              value={meaning.definition}
                              onChange={(e) =>
                                handleMeaningChange(
                                  index,
                                  "definition",
                                  e.target.value
                                )
                              }
                              className="text-sm min-h-[60px]"
                              placeholder="Definition"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-lg leading-none text-foreground">
                              {meaning.translation}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {meaning.definition}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 sm:ml-12 p-3 bg-primary/5 rounded-r-lg border-l-2 border-primary">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={meaning.example}
                            onChange={(e) =>
                              handleMeaningChange(
                                index,
                                "example",
                                e.target.value
                              )
                            }
                            className="text-sm italic"
                            placeholder="Example sentence"
                          />
                          <Input
                            value={meaning.exampleTranslation}
                            onChange={(e) =>
                              handleMeaningChange(
                                index,
                                "exampleTranslation",
                                e.target.value
                              )
                            }
                            className="text-sm text-muted-foreground"
                            placeholder="Example translation"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium italic text-foreground/90">
                            "{meaning.example}"
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meaning.exampleTranslation}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </ScrollArea>
      </ModalContent>
    </Modal>
  );
}
