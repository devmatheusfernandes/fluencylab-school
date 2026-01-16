'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalTrigger,
  ModalIcon,
} from '@/components/ui/modal';
import { ContentSetForm } from './ContentSetForm';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

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
      <ModalContent className="sm:max-w-[500px]">
        <ModalIcon type="document" />
        <ModalHeader>
          <ModalTitle>Create Content Set</ModalTitle>
          <ModalDescription>
            Group learning items into a structured set for students.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <ContentSetForm 
            selectedItemIds={selectedItemIds} 
            onSuccess={() => setOpen(false)} 
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
