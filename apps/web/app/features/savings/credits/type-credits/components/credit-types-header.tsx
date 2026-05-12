import type { Metadata } from 'react';

export const metadata: Metadata = {
  title: 'Tipos de Créditos',
};

export function CreditTypesHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">Tipos de Créditos</h1>
      <p className="text-muted-foreground text-sm">
        Gestiona los tipos de créditos disponibles en el sistema.
      </p>
    </div>
  );
}