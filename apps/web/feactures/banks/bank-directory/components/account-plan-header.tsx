'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BanksModal } from './banks-modal';

export function BanksHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Bancos"
          description="Gestiona el directorio de bancos en el sistema"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Banco
        </Button>
      </div>

      <BanksModal open={open} onOpenChange={setOpen} />
    </>
  );
}
