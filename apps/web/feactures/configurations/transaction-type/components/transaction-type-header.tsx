'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TransactionTypeModal } from './transaction-type-modal';

export function TransactionTypeHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Transacciones"
          description="Gestiona los tipos de transacciones del sistema"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Transacción
        </Button>
      </div>

      <TransactionTypeModal open={open} onOpenChange={setOpen} />
    </>
  );
}