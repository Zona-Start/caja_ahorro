'use client';

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
  /** Valor seleccionado (fecha) */
  value?: Date | null;
  /** Función que se ejecuta al cambiar la fecha */
  onChange?: (date: Date | null) => void;
  /** Función que se ejecuta al perder el foco */
  onBlur?: () => void;
  /** Texto a mostrar cuando no hay fecha seleccionada */
  placeholder?: string;
  /** Deshabilitar el componente */
  disabled?: boolean;
  /** Clases CSS personalizadas para el componente */
  className?: string;
  /** Clases CSS personalizadas para el popover */
  popoverClassName?: string;
  /** Clases CSS personalizadas para el calendario */
  calendarClassName?: string;
  /** Nombre del campo (para formularios) */
  name?: string;
  /** ID del campo (para formularios) */
  id?: string;
  /** Requerido (para formularios) */
  required?: boolean;
  /** Fecha mínima seleccionable */
  minDate?: Date;
  /** Referencia al elemento DOM */
  ref?: React.Ref<HTMLButtonElement>;
}

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
      minDate, // <-- nueva prop
      ...props
    },
    ref,
  ) => {
    const [date, setDate] = useState<Date | null>(value || null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(
      value?.getMonth() ?? new Date().getMonth(),
    );
    const [currentYear, setCurrentYear] = useState(
      value?.getFullYear() ?? new Date().getFullYear(),
    );

    const buttonRef = useRef<HTMLButtonElement>(null);

    // Actualizar el estado interno cuando cambia el valor externo
    useEffect(() => {
      if (value) {
        setDate(value);
        setCurrentMonth(value.getMonth());
        setCurrentYear(value.getFullYear());
      } else {
        setDate(null);
      }
    }, [value]);

    // Nombres de los meses en español
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

    // Generar años para el select (desde 1920 hasta el año actual)
    const actualYear = new Date().getFullYear();
    const years = Array.from(
      { length: actualYear - 1920 + 1 },
      (_, i) => 1920 + i,
    );

    // Función para formatear la fecha en español
    const formatDateInSpanish = (date: Date) => {
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    };

    // Función para generar los días del mes
    const getDaysInMonth = (year: number, month: number) => {
      const days = [];
      const firstDay = new Date(year, month, 1).getDay();

      // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

      // Agregar días vacíos para alinear el primer día del mes
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push(null);
      }

      // Agregar los días del mes
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }

      return days;
    };

    // Obtener los días del mes actual
    const days = getDaysInMonth(currentYear, currentMonth);

    // Nombres de los días de la semana en español
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Función para manejar la selección de un día
    const handleSelectDay = (day: Date | null) => {
      if (day) {
        setDate(day);
        onChange?.(day); // Permitir que el valor sea un objeto Date directamente
        setIsOpen(false);

        // Trigger onBlur para React Hook Form
        if (onBlur) {
          setTimeout(onBlur, 100);
        }
      }
    };

    // Función para manejar el cambio de mes
    const handleMonthChange = (value: string) => {
      setCurrentMonth(Number.parseInt(value));
    };

    // Función para manejar el cambio de año
    const handleYearChange = (value: string) => {
      setCurrentYear(Number.parseInt(value));
    };

    // Verificar si una fecha es hoy
    const isToday = (day: Date) => {
      const today = new Date();
      return (
        day.getDate() === today.getDate() &&
        day.getMonth() === today.getMonth() &&
        day.getFullYear() === today.getFullYear()
      );
    };

    // Verificar si una fecha está seleccionada
    const isSelected = (day: Date) => {
      if (!date) return false;
      return (
        day.getDate() === date.getDate() &&
        day.getMonth() === date.getMonth() &&
        day.getFullYear() === date.getFullYear()
      );
    };

    // Manejar el cierre del popover
    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open && onBlur) {
        onBlur();
      }
    };

    return (
      <Popover
        open={isOpen && !disabled}
        onOpenChange={disabled ? undefined : handleOpenChange}
      >
        <PopoverTrigger asChild>
          <Button
            ref={(node) => {
              // Pasar la ref al botón
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
            {/* Selectores de mes y año */}
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

            {/* Calendario */}
            <div className="calendar">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
                {diasSemana.map((dia) => (
                  <div key={dia} className="p-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
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
                          minDate && day < new Date(minDate.setHours(0,0,0,0)) && 'opacity-40 pointer-events-none' // deshabilita días menores a minDate
                        )}
                        onClick={() => handleSelectDay(day)}
                        disabled={minDate && day < new Date(minDate.setHours(0,0,0,0))}
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
