import { Heading } from '@repo/shadcn/heading';

export function WithdrawalTypesHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Tipos de Retiros"
        description="Gestiona los tipos de retiros del sistema"
      />
    </div>
  );
}
