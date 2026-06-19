import { Heading } from '@repo/shadcn/heading';

interface GlobalSettingsHeaderProps {
  count?: number;
}

export function GlobalSettingsHeader({ count }: GlobalSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Parámetros de la Plataforma"
        description="Gestiona los parámetros globales del la plataforma"
      />
    </div>
  );
}