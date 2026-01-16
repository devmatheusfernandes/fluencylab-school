'use client';

import { useState, useMemo } from 'react';
import { LearningItem } from '@/types/content';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalTrigger,
} from '@/components/ui/modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Volume2, FilterX, BookOpen, Layers, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Header } from '@/components/ui/header';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { CreateContentSetModal } from './CreateContentSetModal';

interface LearningItemsListProps {
  items: LearningItem[];
  isLoading?: boolean;
}

// Componente para badge de nível com cores consistentes
const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    A1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    A2: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B1: 'bg-blue-100 text-blue-700 border-blue-200',
    B2: 'bg-blue-100 text-blue-700 border-blue-200',
    C1: 'bg-purple-100 text-purple-700 border-purple-200',
    C2: 'bg-pink-100 text-pink-700 border-pink-200',
  };

  return (
    <Badge variant="outline" className={cn("font-semibold", colors[level] || 'bg-gray-100')}>
      {level}
    </Badge>
  );
};

export function LearningItemsList({ items: initialItems, isLoading = false }: LearningItemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Extrair valores únicos para os filtros
  const uniqueLanguages = useMemo(() => Array.from(new Set(initialItems.map(i => i.language).filter(Boolean))), [initialItems]);
  const uniqueLevels = useMemo(() => Array.from(new Set(initialItems.map(i => i.level).filter(Boolean))).sort(), [initialItems]);
  const uniqueTypes = useMemo(() => Array.from(new Set(initialItems.map(i => i.type).filter(Boolean))).sort(), [initialItems]);

  // Lógica de Filtragem
  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      const matchesSearch =
        item.mainText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meanings.some(m => m.translation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLanguage = selectedLanguage === 'all' || item.language === selectedLanguage;
      const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel;
      const matchesType = selectedType === 'all' || item.type === selectedType;

      return matchesSearch && matchesLanguage && matchesLevel && matchesType;
    });
  }, [initialItems, searchTerm, selectedLanguage, selectedLevel, selectedType]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLanguage('all');
    setSelectedLevel('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedLanguage !== 'all' || selectedLevel !== 'all' || selectedType !== 'all';

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
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
                  <Badge variant="secondary" className="ml-2">{filteredItems.length}</Badge>
                </div>
              }
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
               <Link href="/hub/admin/content-sets">
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Sets
                  </Button>
               </Link>
               
               <CreateContentSetModal 
                 selectedItemIds={selectedIds} 
                 trigger={
                   <Button variant="outline">
                     <Layers className="mr-2 h-4 w-4" />
                     {selectedIds.length > 0 ? `Create Set (${selectedIds.length})` : 'Create Set'}
                   </Button>
                 }
               />

               {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Filters Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pb-2s">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search word or meaning..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {uniqueLanguages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No vocabulary found</h3>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search terms.</p>
            <Button variant="link" onClick={clearFilters} className="mt-2">Clear all filters</Button>
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
                        checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
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
                        className={selectedIds.includes(item.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-base text-foreground font-semibold">{item.mainText}</span>
                            {item.phonetic && <span className="text-xs text-muted-foreground font-mono">{item.phonetic}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{item.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-muted-foreground">{item.type}</Badge>
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
                 <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                 <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                    {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
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
                    <Card className={cn(selectedIds.includes(item.id) && "border-primary")}>
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
                                <h3 className="text-lg font-bold">{item.mainText}</h3>
                                <Badge variant="secondary" className="text-[10px] uppercase">{item.language}</Badge>
                                </div>
                                {item.phonetic && <span className="text-xs text-muted-foreground font-mono">{item.phonetic}</span>}
                            </div>
                          </div>
                          <DetailModal item={item} />
                        </div>
                        
                        <div className="flex gap-2 mb-3 ml-8">
                          <LevelBadge level={item.level} />
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground border-t pt-2 mt-2 ml-8">
                          <span className="font-medium text-foreground">Meaning: </span>
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
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
          <Eye className="h-4 w-4" />
        </Button>
      </ModalTrigger>
      <ModalContent showHandle={false} className="bg-black! max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="flex items-center gap-3 text-3xl font-bold text-primary">
                {item.mainText}
                <Badge variant="secondary" className="text-sm font-normal uppercase align-middle">{item.language}</Badge>
              </h2>
              <div className="flex items-center gap-3">
                {item.phonetic && (
                  <div className="text-muted-foreground flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md text-sm font-mono">
                    {item.phonetic}
                    <Volume2 className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
                  </div>
                )}
                <Badge variant="outline">{item.type}</Badge>
                <LevelBadge level={item.level} />
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 mt-2">
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
                      <span className="text-[10px] text-muted-foreground uppercase">{key}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meanings Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Meanings & Contexts</h4>
              {item.meanings.map((meaning, index) => (
                <div key={index} className="space-y-3 pb-4 border-b border-dashed last:border-0">
                  <div className="flex items-start gap-3">
                    <Badge className="mt-1 shrink-0" variant="secondary">{meaning.context}</Badge>
                    <div className="space-y-1">
                      <p className="font-bold text-lg leading-none text-foreground">{meaning.translation}</p>
                      <p className="text-muted-foreground text-sm">{meaning.definition}</p>
                    </div>
                  </div>
                  
                  <div className="ml-2 sm:ml-12 p-3 bg-primary/5 rounded-r-lg border-l-2 border-primary">
                    <p className="text-sm font-medium italic text-foreground/90">"{meaning.example}"</p>
                    <p className="text-sm text-muted-foreground mt-1">{meaning.exampleTranslation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </ModalContent>
    </Modal>
  );
}
