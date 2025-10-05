'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useState } from 'react';
import { AdvancesTab } from './advances-tab';
import { CreditNotesTab } from './credit-notes-tab';
import { DebitNotesTab } from './debit-notes-tab';

interface ManageDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageDocumentsModal({
  open,
  onOpenChange,
}: ManageDocumentsModalProps) {
  const [activeTab, setActiveTab] = useState('advances');
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[1000px] z-50 backdrop-blur-lg flex flex-col max-h-[90vh] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nota de Crédito / Débito</DialogTitle>
          <DialogDescription>
            Complete los campos para crear una nota de crédito o débito.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue="advances"
          className="flex flex-col flex-1 w-full overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="advances"
              onClick={() => setActiveTab('advances')}
              className={`border-b-2 ${
                activeTab === 'haberes'
                  ? 'border-b-primary dark:!border-b-primary'
                  : 'border-transparent dark:border-transparent'
              }`}
            >
              Anticipos
            </TabsTrigger>
            <TabsTrigger
              value="credit-notes"
              onClick={() => setActiveTab('credit-notes')}
              className={`border-b-2 ${
                activeTab === 'haberes'
                  ? 'border-b-primary dark:!border-b-primary'
                  : 'border-transparent dark:border-transparent'
              }`}
            >
              Notas de Crédito
            </TabsTrigger>
            <TabsTrigger
              value="debit-notes"
              onClick={() => setActiveTab('debit-notes')}
              className={`border-b-2 ${
                activeTab === 'haberes'
                  ? 'border-b-primary dark:!border-b-primary'
                  : 'border-transparent dark:border-transparent'
              }`}
            >
              Notas de Débito
            </TabsTrigger>
          </TabsList>
          <TabsContent value="advances" className="flex-1 flex flex-col mt-4">
            <AdvancesTab />
          </TabsContent>
          <TabsContent
            value="credit-notes"
            className="flex-1 flex flex-col mt-4"
          >
            <CreditNotesTab />
          </TabsContent>
          <TabsContent
            value="debit-notes"
            className="flex-1 flex flex-col mt-4"
          >
            <DebitNotesTab />
          </TabsContent>
        </Tabs>
        <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
