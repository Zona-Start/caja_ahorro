import { List, RotateCcw } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@repo/shadcn/toogle-group';

export type MovementsView = 'records' | 'overcharges';

interface MovementsViewToggleProps {
  value: MovementsView;
  onChange: (value: MovementsView) => void;
  recordsLabel: string;
  overchargesLabel?: string;
}

export function MovementsViewToggle({
  value,
  onChange,
  recordsLabel,
  overchargesLabel = 'Cobros en Exceso',
}: MovementsViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as MovementsView)}
      variant="outline"
      size="sm"
      className="w-fit justify-start rounded-lg bg-muted/50 p-1"
    >
      <ToggleGroupItem
        value="records"
        className="gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <List className="h-4 w-4" />
        {recordsLabel}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="overcharges"
        className="gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        {overchargesLabel}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
