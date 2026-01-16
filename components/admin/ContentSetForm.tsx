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

interface ContentSetFormProps {
  initialData?: ContentSet;
  onSuccess?: () => void;
  selectedItemIds?: string[]; // IDs passed from selection
}

export function ContentSetForm({ initialData, onSuccess, selectedItemIds = [] }: ContentSetFormProps) {
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
          // Reset form
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
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title"
          placeholder="e.g. Travel Essentials" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          placeholder="Describe this collection..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="pt-2 text-sm text-muted-foreground space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span>
            Items included:{' '}
            <span className="font-medium text-foreground">{itemIds.length}</span>
          </span>
          {itemIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setItemIds([])}
            >
              Clear all
            </Button>
          )}
        </div>

        {itemIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {itemIds
              .map((id) => availableItems.find((it) => it.id === id) || { id } as any)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setItemIds((prev) => prev.filter((itemId) => itemId !== item.id))
                  }
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <span className="max-w-[160px] truncate">
                    {item.slug || item.mainText || item.id}
                  </span>
                  <span className="text-muted-foreground">&times;</span>
                </button>
              ))}
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Add items by search</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="w-full sm:w-auto">
              <Select
                value={languageFilter}
                onValueChange={setLanguageFilter}
              >
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Command>
            <CommandInput
              placeholder="Search by word or slug..."
              value={newItemQuery}
              onValueChange={setNewItemQuery}
            />
            <CommandList>
              <CommandEmpty>
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
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {item.mainText}
                          </span>
                          <span className="text-xs text-muted-foreground">
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

      <div className="flex justify-end gap-2">
         <Button type="submit" disabled={isSubmitting}>
           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {initialData ? 'Update Set' : 'Create Set'}
         </Button>
      </div>
    </form>
  );
}
