'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountingEntryHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Asientos Contables"
          description="Cree y gestione los asientos contables de la empresa."
        />
      </div>
    </>
  );
}
