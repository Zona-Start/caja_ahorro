import { Heading } from '@repo/shadcn/heading';

export default function InventoryMovementHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title="Movimientos de Inventario" description="Gestiona los movimientos de inventario" />
      </div>
    </>
  );
}
