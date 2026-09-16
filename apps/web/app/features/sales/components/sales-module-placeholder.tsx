import { Card, CardContent } from '@repo/shadcn/card';
import { Construction } from 'lucide-react';

interface SalesModulePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Temporary placeholder used while the sales module is being built.
 * Replaced by the real feature page in a later phase.
 */
export function SalesModulePlaceholder({
  title,
  description,
}: SalesModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            Módulo en construcción.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
