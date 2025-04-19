'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AssociatesModal } from './associates-modal';

export function AssociatesHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Asociados"
          description="Gestiona los Asociados de la caja"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar socio
        </Button>
      </div>

      <AssociatesModal open={open} onOpenChange={setOpen} />
    </>
  );
}
