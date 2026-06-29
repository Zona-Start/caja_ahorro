import { Heading } from '@repo/shadcn/heading';

export function MovementsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Movimientos de Inventario"
        description="Registra y consulta entradas, salidas y ajustes de inventario"
      />
    </div>
  );
}
