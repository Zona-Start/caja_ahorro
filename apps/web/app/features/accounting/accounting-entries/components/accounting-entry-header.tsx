import { Heading } from '@repo/shadcn/heading';

export function AccountingEntryHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Asientos Contables"
        description="Gestiona los registros contables manuales y automáticos"
      />
    </div>
  );
}
