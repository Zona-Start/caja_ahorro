'use client';

import { Heading } from '@repo/shadcn/heading';

export function TypeCreditsHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Créditos"
          description="Gestiona los tipos de créditos del sistema"
        />
      </div>
    </>
  );
}
