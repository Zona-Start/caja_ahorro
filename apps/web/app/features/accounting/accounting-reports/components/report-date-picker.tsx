import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import { X } from 'lucide-react';

interface ReportDatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
}

const toDate = (value: string) =>
  value ? new Date(`${value}T12:00:00`) : null;

const toDateString = (date: Date | null) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ReportDatePicker({
  id,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled,
  minDate,
}: ReportDatePickerProps) {
  return (
    <div className="flex items-center gap-1">
      <CustomCalendar
        id={id}
        value={toDate(value)}
        onChange={(date) => onChange(toDateString(date))}
        placeholder={placeholder}
        disabled={disabled}
        minDate={minDate}
        className="flex-1"
      />
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange('')}
          title="Limpiar fecha"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
