// 'use client';

// import { Badge } from '@repo/shadcn/badge';
// import { Button } from '@repo/shadcn/button';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@repo/shadcn/command';
// import { cn } from '@repo/shadcn/lib/utils';
// import { Popover, PopoverContent, PopoverTrigger } from '@repo/shadcn/popover';
// import { cva } from 'class-variance-authority';
// import { Check, ChevronsUpDown } from 'lucide-react';
// import * as React from 'react';

// const multiSelectVariants = cva(
//   'm-0 flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
//   {
//     variants: {
//       variant: {
//         default:
//           'border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
//         inverted:
//           'border-0 bg-muted text-muted-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
//       },
//     },
//     defaultVariants: {
//       variant: 'default',
//     },
//   },
// );

// export interface Option {
//   value: string;
//   label: string;
//   icon?: React.ComponentType<{ className?: string }>;
// }

// interface MultiSelectProps
//   extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
//   options: {
//     label: string;
//     value: string;
//   }[];
//   onChange: (value: string[]) => void; // This is the required prop
//   value: string[]; // Added value prop
//   defaultValue?: string[];
//   placeholder?: string;
//   variant: 'default' | 'inverted';
//   animation?: number;
//   maxSelected?: number;
//   hidePlaceholderWhenSelected?: boolean;
//   loop?: boolean;
//   disabled?: boolean;
//   className?: string; // ← añade esta línea
// }

// const MultiSelect = React.forwardRef<
//   React.ElementRef<typeof CommandPrimitive.Input>,
//   MultiSelectProps
// >(
//   (
//     {
//       options,
//       onChange,
//       value,
//       defaultValue,
//       placeholder,
//       variant,
//       animation,
//       maxSelected,
//       hidePlaceholderWhenSelected,
//       loop,
//       disabled,
//       className,
//       ...props
//     },
//     ref,
//   ) => {
//     const [open, setOpen] = React.useState(false);
//     const [search, setSearch] = React.useState('');

//     const handleSelect = (selectedValue: string) => {
//       if (value.includes(selectedValue)) {
//         onChange(value.filter((v) => v !== selectedValue));
//       } else {
//         onChange([...value, selectedValue]);
//       }
//     };

//     const handleClear = () => {
//       onChange([]);
//     };

//     const filteredOptions = options.filter((option) =>
//       option.label.toLowerCase().includes(search.toLowerCase()),
//     );

//     return (
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             ref={ref}
//             {...props}
//             onClick={() => setOpen(!open)}
//             className="w-full"
//             variant="outline"
//           >
//             <div className="flex w-full items-center justify-between">
//               <div className="flex flex-wrap items-center gap-2">
//                 {value.length > 0 ? (
//                   value.slice(0, maxSelected).map((v) => {
//                     const option = options.find((opt) => opt.value === v);
//                     return (
//                       <Badge
//                         key={v}
//                         variant="secondary"
//                         className="flex items-center gap-1"
//                       >
//                         {option?.label}
//                       </Badge>
//                     );
//                   })
//                 ) : (
//                   <span className="text-muted-foreground">{placeholder}</span>
//                 )}
//                 {maxSelected && value.length > maxSelected && (
//                   <Badge variant="secondary">
//                     +{value.length - maxSelected}
//                   </Badge>
//                 )}
//               </div>
//               <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
//             </div>
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
//           <Command>
//             <CommandInput
//               placeholder="Search..."
//               value={search}
//               onValueChange={setSearch}
//             />
//             <CommandList>
//               <CommandEmpty>No results found.</CommandEmpty>
//               <CommandGroup>
//                 {filteredOptions.map((option) => (
//                   <CommandItem
//                     key={option.value}
//                     onSelect={() => handleSelect(option.value)}
//                   >
//                     <Check
//                       className={cn(
//                         'mr-2 h-4 w-4',
//                         value.includes(option.value)
//                           ? 'opacity-100'
//                           : 'opacity-0',
//                       )}
//                     />
//                     {option.label}
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//     );
//   },
// );

// MultiSelect.displayName = 'MultiSelect';

// export { MultiSelect };

'use client';

import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/shadcn/command';

import { cn } from '@repo/shadcn/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/shadcn/popover';
import { cva } from 'class-variance-authority';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

const multiSelectVariants = cva(
  'm-0 flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        inverted:
          'border-0 bg-muted text-muted-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
  options: {
    label: string;
    value: string;
  }[];
  onChange: (value: string[]) => void;
  value: string[];
  defaultValue?: string[];
  placeholder?: string;
  variant?: 'default' | 'inverted';
  animation?: number;
  maxSelected?: number;
  hidePlaceholderWhenSelected?: boolean;
  loop?: boolean;
  disabled?: boolean;
  className?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onChange,
      value,
      defaultValue,
      placeholder = 'Select options...',
      variant = 'default',
      animation,
      maxSelected = 3,
      hidePlaceholderWhenSelected,
      loop,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const handleSelect = (selectedValue: string) => {
      if (value.includes(selectedValue)) {
        onChange(value.filter((v) => v !== selectedValue));
      } else {
        onChange([...value, selectedValue]);
      }
    };

    const handleClear = () => {
      onChange([]);
    };

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            onClick={() => setOpen(!open)}
            className={cn('w-full', className)}
            variant="outline"
            disabled={disabled}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {value.length > 0 ? (
                  value.slice(0, maxSelected).map((v) => {
                    const option = options.find((opt) => opt.value === v);
                    return (
                      <Badge
                        key={v}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {option?.label}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
                {maxSelected && value.length > maxSelected && (
                  <Badge variant="secondary">
                    +{value.length - maxSelected}
                  </Badge>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
