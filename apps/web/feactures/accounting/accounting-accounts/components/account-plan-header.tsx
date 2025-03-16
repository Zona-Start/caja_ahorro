'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AccountPlanModal } from './account-plan-modal';

export function AccountPlanHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Cuentas Contables"
          description="Gestiona las cuentas contables del plan de cuentas"
        />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Cuenta
        </Button>
      </div>

      <AccountPlanModal open={open} onOpenChange={setOpen} />
    </>
  );
}