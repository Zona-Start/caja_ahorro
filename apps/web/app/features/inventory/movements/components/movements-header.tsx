import { Heading } from '@repo/shadcn/heading';

export function MovementsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Movimientos de Inventario"
        description="Consulta los movimientos y el stock de los ítems del inventario"
      />
    </div>
  );
}
