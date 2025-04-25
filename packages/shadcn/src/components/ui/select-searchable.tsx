'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@repo/shadcn/lib/utils';

function SelectSearchable({
  options,
  onValueChange,
  placeholder,
  defaultValue,
  disabled,
  enableNoneOption = false, // New prop to enable or disable "Ninguno"
}: {
  options: { value: string; label: string }[];
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  enableNoneOption?: boolean;
}) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOptions = [
    ...(enableNoneOption ? [{ value: 'null', label: 'Ninguno' }] : []), // Conditionally add "Ninguno"
    ...options,
  ].filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <SelectPrimitive.Root
      onValueChange={(value) => onValueChange(value === 'null' ? null : value)}
      defaultValue={defaultValue}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          disabled && 'bg-muted',
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Content
        className="bg-popover text-popover-foreground z-50 max-h-60 w-full overflow-y-auto rounded-md border shadow-md"
        position="popper"
        style={{ width: 'var(--radix-select-trigger-width)' }}
      >
        <div className="p-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground aria-invalid:outline-destructive/60 aria-invalid:ring-destructive/20 dark:aria-invalid:outline-destructive dark:aria-invalid:ring-destructive/50 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 aria-invalid:border-destructive/60 dark:aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:focus-visible:ring-[3px] aria-invalid:focus-visible:outline-none md:text-sm dark:aria-invalid:focus-visible:ring-4"
          />
        </div>
        <SelectPrimitive.Viewport className="p-1">
          {filteredOptions.map((option) => (
            <SelectPrimitive.Item
              key={option.value}
              value={option.value}
              className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
            >
              <SelectPrimitive.ItemText>
                {option.label}
              </SelectPrimitive.ItemText>
              <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center justify-center">
                <CheckIcon className="size-4" />
              </SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Root>
  );
}

export { SelectSearchable };
