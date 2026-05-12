import { Heading } from '@repo/shadcn/heading';

export function WithdrawalHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Retiros"
        description="Gestión y registro de retiros de haberes de los asociados"
      />
    </div>
  );
}
