'use client';

import { Heading } from '@repo/shadcn/heading';

export function BanksHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Bancos"
          description="Gestiona el directorio de bancos en el sistema"
        />
      </div>
    </>
  );
}
