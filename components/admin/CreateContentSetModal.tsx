'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalTrigger,
  ModalIcon,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { createContentSet, updateContentSet } from '@/actions/content-sets';
import { toast } from 'sonner';
import { ContentSet, CEFRLevel, LearningItem } from '@/types/content';
import { ContentSetForm } from './ContentSetForm';

// --- CreateContentSetModal Component ---

interface CreateContentSetModalProps {
  selectedItemIds?: string[];
  trigger?: React.ReactNode;
}

export function CreateContentSetModal({ selectedItemIds = [], trigger }: CreateContentSetModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Layers className="mr-2 h-4 w-4" />
            Create
          </Button>
        )}
      </ModalTrigger>
      {/* Adicionado max-h e flex para garantir que cabe na tela em mobile */}
      <ModalContent className="sm:max-w-[600px] w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
        <div className="p-6 pb-2">
          <ModalIcon type="document" />
          <ModalHeader>
            <ModalTitle>Create Content Set</ModalTitle>
            <ModalDescription>
              Group learning items into a structured set for students.
            </ModalDescription>
          </ModalHeader>
        </div>
        
        {/* ModalBody com scroll para gerenciar conteúdo extenso */}
        <ModalBody className="px-6 overflow-y-auto flex-1">
          <ContentSetForm 
            selectedItemIds={selectedItemIds} 
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// --- ContentSetForm Component ---
