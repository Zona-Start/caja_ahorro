'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TypeLoansModal } from './type-loans-modal';

export function TypeLoansHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Prestamos"
          description="Gestiona los tipos de prestamos del sistema"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Tipo
        </Button>
      </div>

      <TypeLoansModal open={open} onOpenChange={setOpen} />
    </>
  );
}
