'use client';

import { ContentSet } from '@/types/content';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { deleteContentSet } from '@/actions/content-sets';
import { toast } from 'sonner';
import { Header } from '@/components/ui/header';
import { CreateContentSetModal } from './CreateContentSetModal';
import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalIcon,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from '@/components/ui/modal';
import { ContentSetForm } from './ContentSetForm';

interface ContentSetsListProps {
  sets: ContentSet[];
}

export function ContentSetsList({ sets }: ContentSetsListProps) {
  const [editingSet, setEditingSet] = useState<ContentSet | null>(null);
  const [deletingSet, setDeletingSet] = useState<ContentSet | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingSet) return;

    const result = await deleteContentSet(deletingSet.id);
    if (result.success) {
      toast.success('Set deleted successfully');
    } else {
      toast.error('Failed to delete set');
    }
    setDeletingSet(null);
  };

  return (
    <Card className="w-full border-none! bg-transparent! p-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <Header
              heading="Content Sets"
              subheading="Manage collections of learning items."
              icon={
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="ml-2">{sets.length}</Badge>
                </div>
              }
              className="w-full"
            />
            <CreateContentSetModal />
        </div>
        <CardHeader>
        
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No content sets found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sets.map((set) => (
                  <TableRow key={set.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{set.title}</span>
                        {set.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {set.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                        {set.language}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{set.level}</Badge>
                    </TableCell>
                    <TableCell>{set.itemsCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSet(set)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingSet(set)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Modal */}
      <Modal open={!!editingSet} onOpenChange={(open) => !open && setEditingSet(null)}>
      <ModalContent className="sm:max-w-[600px] w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
          <ModalIcon type="edit" />
          <ModalHeader>
            <ModalTitle>Edit Content Set</ModalTitle>
            <ModalDescription>Update details for {editingSet?.title}</ModalDescription>
          </ModalHeader>
          <ModalBody>
             {editingSet && (
               <ContentSetForm 
                 initialData={editingSet} 
                 onSuccess={() => setEditingSet(null)} 
               />
             )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!deletingSet} onOpenChange={(open) => !open && setDeletingSet(null)}>
        <ModalContent className="sm:max-w-[500px]">
          <ModalIcon type="warning" />
          <ModalHeader>
            <ModalTitle>Delete Content Set</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete "{deletingSet?.title}"?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton type="button" onClick={() => setDeletingSet(null)}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
