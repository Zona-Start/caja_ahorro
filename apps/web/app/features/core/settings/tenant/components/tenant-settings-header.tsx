import { Heading } from '@repo/shadcn/heading';

interface TenantSettingsHeaderProps {
  count?: number;
}

export function TenantSettingsHeader({ count }: TenantSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title={`Parámetros General (${count ?? 0})`}
        description="Gestiona los parámetros de configuración de tu organización"
      />
    </div>
  );
}