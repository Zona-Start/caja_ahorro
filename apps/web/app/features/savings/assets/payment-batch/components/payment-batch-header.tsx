import { Heading } from '@repo/shadcn/heading';

export function PaymentBatchHeader() {
  return (
    <div className="flex items-start justify-between mb-2">
      <Heading
        title="Pagos por Lotes"
        description="Gestione los lotes de desembolsos, retiros y liquidaciones"
      />
    </div>
  );
}
