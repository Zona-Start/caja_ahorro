'use client';

import { Heading } from '@repo/shadcn/heading';

export function TypeOperationsHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Operaciones"
          description="Gestiona los tipos de operaciones del sistema"
        />
      </div>
    </>
  );
}
