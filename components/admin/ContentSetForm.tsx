'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createContentSet, updateContentSet } from '@/actions/content-sets';
import { toast } from 'sonner';
import { ContentSet, CEFRLevel, LearningItem } from '@/types/content';
import { Loader2 } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Modal, ModalFooter, ModalPrimaryButton, ModalSecondaryButton } from '../ui/modal';

interface ContentSetFormProps {
  initialData?: ContentSet;
  onSuccess?: () => void;
  onCancel?: () => void;
  selectedItemIds?: string[];
}

export function ContentSetForm({ initialData, onSuccess, onCancel, selectedItemIds = [] }: ContentSetFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [language, setLanguage] = useState(initialData?.language || 'en');
  const [level, setLevel] = useState<CEFRLevel>(initialData?.level || 'A1');
  const [itemIds, setItemIds] = useState<string[]>(initialData?.itemIds || selectedItemIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemQuery, setNewItemQuery] = useState('');
  const [availableItems, setAvailableItems] = useState<LearningItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoadingItems(true);
        const res = await fetch('/api/admin/learning-items');
        if (!res.ok) {
          throw new Error('Failed to load items');
        }
        const data = await res.json();
        setAvailableItems(data || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load learning items');
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  const languageOptions = useMemo(
    () =>
      Array.from(
        new Set(availableItems.map((it) => it.language).filter(Boolean))
      ),
    [availableItems]
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(availableItems.map((it) => it.type).filter(Boolean))),
    [availableItems]
  );

  const filteredItems = useMemo(
    () =>
      availableItems.filter((item) => {
        const matchesLanguage =
          languageFilter === 'all' || item.language === languageFilter;
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        return matchesLanguage && matchesType;
      }),
    [availableItems, languageFilter, typeFilter]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (title.length < 2) {
      toast.error('Title must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const values = {
        title,
        description,
        language,
        level,
        itemIds,
      };

      if (initialData) {
        const result = await updateContentSet(initialData.id, values);
        if (result.success) {
          toast.success('Content Set updated successfully');
          onSuccess?.();
        } else {
          toast.error('Failed to update Content Set');
        }
      } else {
        const result = await createContentSet(values);
        if (result.success) {
          toast.success('Content Set created successfully');
          onSuccess?.();
          setTitle('');
          setDescription('');
          setLanguage('en');
          setLevel('A1');
          setItemIds([]);
        } else {
          toast.error('Failed to create Content Set');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            placeholder="e.g. Travel Essentials" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            placeholder="Describe this collection..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Grid responsivo: 1 coluna no mobile, 2 no desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={level} onValueChange={(val) => setLevel(val as CEFRLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 text-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">
              Items included:{' '}
              <span className="font-medium text-foreground">{itemIds.length}</span>
            </span>
            {itemIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => setItemIds([])}
              >
                Clear all
              </Button>
            )}
          </div>

          {itemIds.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1 bg-muted/20 rounded-md">
              {itemIds
                .map((id) => availableItems.find((it) => it.id === id) || { id } as any)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setItemIds((prev) => prev.filter((itemId) => itemId !== item.id))
                    }
                    className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  >
                    <span className="max-w-[120px] truncate">
                      {item.slug || item.mainText || item.id}
                    </span>
                    <span>&times;</span>
                  </button>
                ))}
            </div>
          )}

          <div className="space-y-2 rounded-lg border p-3 bg-muted/10">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Add items</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="h-8 text-xs flex-1 sm:flex-none sm:w-[130px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs flex-1 sm:flex-none sm:w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Command className="border rounded-md shadow-sm">
              <CommandInput
                placeholder="Search vocabulary..."
                value={newItemQuery}
                onValueChange={setNewItemQuery}
                className="h-9 text-sm"
              />
              <CommandList className="max-h-[130px]"> {/* Altura limitada para não estourar a tela */}
                <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
                  {isLoadingItems ? 'Loading items...' : 'No items found.'}
                </CommandEmpty>
                {!isLoadingItems && (
                  <CommandGroup heading="Vocabulary items">
                    {filteredItems.map((item) => {
                      const label = `${item.mainText} (${item.slug})`;
                      const alreadyIncluded = itemIds.includes(item.id);
                      return (
                        <CommandItem
                          key={item.id}
                          value={label}
                          disabled={alreadyIncluded}
                          onSelect={() => {
                            if (!alreadyIncluded) {
                              setItemIds((prev) => [...prev, item.id]);
                            }
                          }}
                          className="text-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {item.mainText}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.slug}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      </div>

      <ModalFooter className="mt-4 pt-2 border-t sm:justify-end">
        {onCancel && (
          <ModalSecondaryButton type="button" onClick={onCancel}>
            Cancel
          </ModalSecondaryButton>
        )}
        <ModalPrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Set' : 'Create Set'}
        </ModalPrimaryButton>
      </ModalFooter>

    </form>
  );
}