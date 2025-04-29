'use client';

import { Heading } from '@repo/shadcn/heading';

export function TypeLoansHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Prestamos"
          description="Gestiona los tipos de prestamos del sistema"
        />
      </div>
    </>
  );
}
