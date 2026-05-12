import { Heading } from '@repo/shadcn/heading';

export function BankDirectoryHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Bancos"
        description="Gestiona el directorio de bancos del sistema"
      />
    </div>
  );
}
