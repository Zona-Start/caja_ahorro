import { Heading } from '@repo/shadcn/heading';

interface GlobalSettingsHeaderProps {
  count?: number;
}

export function GlobalSettingsHeader({ count }: GlobalSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title={`Parámetros Globales (${count ?? 0})`}
        description="Gestiona los parámetros de configuración global del sistema"
      />
    </div>
  );
}