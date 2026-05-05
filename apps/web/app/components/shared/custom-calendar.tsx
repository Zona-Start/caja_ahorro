import type React from 'react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';

export interface CustomCalendarProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
  calendarClassName?: string;
  name?: string;
  id?: string;
  required?: boolean;
  minDate?: Date;
  ref?: React.Ref<HTMLButtonElement>;
}

const toDate = (
  value: Date | string | number | null | undefined,
): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const CustomCalendar = forwardRef<
  HTMLButtonElement,
  CustomCalendarProps
>(
  (
    {
      value,
      onChange,
      onBlur,
      placeholder = 'Seleccionar fecha',
      disabled = false,
      className,
      popoverClassName,
      calendarClassName,
      name,
      id,
      required = false,
      minDate,
      ...props
    },
    ref,
  ) => {
    const dateValue = toDate(value);

    const [date, setDate] = useState<Date | null>(dateValue);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(
      dateValue?.getMonth() ?? new Date().getMonth(),
    );
    const [currentYear, setCurrentYear] = useState(
      dateValue?.getFullYear() ?? new Date().getFullYear(),
    );

    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      const convertedDate = toDate(value);
      if (convertedDate) {
        setDate(convertedDate);
        setCurrentMonth(convertedDate.getMonth());
        setCurrentYear(convertedDate.getFullYear());
      } else {
        setDate(null);
      }
    }, [value]);

    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    const actualYear = new Date().getFullYear();
    const years = Array.from(
      { length: actualYear - 1920 + 1 },
      (_, i) => 1920 + i,
    );

    const formatDateInSpanish = (date: Date) => {
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    };

    const getDaysInMonth = (year: number, month: number) => {
      const days = [];
      const firstDay = new Date(year, month, 1).getDay();
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push(null);
      }

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }

      return days;
    };

    const days = getDaysInMonth(currentYear, currentMonth);
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const handleSelectDay = (day: Date | null) => {
      if (day) {
        setDate(day);
        onChange?.(day);
        setIsOpen(false);
        if (onBlur) {
          setTimeout(onBlur, 100);
        }
      }
    };

    const handleMonthChange = (value: string) => {
      setCurrentMonth(Number.parseInt(value));
    };

    const handleYearChange = (value: string) => {
      setCurrentYear(Number.parseInt(value));
    };

    const isToday = (day: Date) => {
      const today = new Date();
      return (
        day.getDate() === today.getDate() &&
        day.getMonth() === today.getMonth() &&
        day.getFullYear() === today.getFullYear()
      );
    };

    const isSelected = (day: Date) => {
      if (!date) return false;
      return (
        day.getDate() === date.getDate() &&
        day.getMonth() === date.getMonth() &&
        day.getFullYear() === date.getFullYear()
      );
    };

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open && onBlur) {
        onBlur();
      }
    };

    const isDateDisabled = (day: Date) => {
      if (!minDate) return false;
      const minDateTime = new Date(minDate);
      minDateTime.setHours(0, 0, 0, 0);
      const dayTime = new Date(day);
      dayTime.setHours(0, 0, 0, 0);
      return dayTime < minDateTime;
    };

    return (
      <Popover
        open={isOpen && !disabled}
        onOpenChange={disabled ? undefined : handleOpenChange}
      >
        <PopoverTrigger asChild>
          <Button
            ref={(node: any) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              buttonRef.current = node;
            }}
            id={id}
            name={name}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              className,
            )}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDateInSpanish(date) : placeholder}
            {required && <span className="text-destructive ml-1">*</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto p-4', popoverClassName)}
          align="start"
        >
          <div className={cn('space-y-4', calendarClassName)}>
            <div className="flex space-x-2">
              <Select
                value={currentMonth.toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="calendar">
              <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
                {diasSemana.map((dia) => (
                  <div key={dia} className="p-2">
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mt-1">
                {days.map((day, index) => (
                  <div key={index} className="p-0">
                    {day ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          'h-9 w-9 p-0 font-normal',
                          isToday(day) && 'bg-accent text-accent-foreground',
                          isSelected(day) &&
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                          isDateDisabled(day) &&
                            'opacity-40 pointer-events-none',
                        )}
                        onClick={() => handleSelectDay(day)}
                        disabled={isDateDisabled(day)}
                      >
                        {day.getDate()}
                      </Button>
                    ) : (
                      <div className="h-9 w-9"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

CustomCalendar.displayName = 'CustomCalendar';
