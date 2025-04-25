'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SettingSystemModal } from './system-properties-modal';

export function SettingSystemHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Propiedades del Sistema"
          description="Gestiona las propiedades del sistema"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Propiedad
        </Button>
      </div>

      <SettingSystemModal open={open} onOpenChange={setOpen} />
    </>
  );
}
