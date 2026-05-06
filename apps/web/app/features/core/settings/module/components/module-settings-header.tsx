import { Heading } from '@repo/shadcn/heading';

interface ModuleSettingsHeaderProps {
  count?: number;
}

export function ModuleSettingsHeader({ count }: ModuleSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title={`Parámetros por Módulo (${count ?? 0})`}
        description="Gestiona los parámetros de configuración por módulo"
      />
    </div>
  );
}