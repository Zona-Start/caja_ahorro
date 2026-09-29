import { Input } from '@repo/shadcn/input';
import { cn } from '@repo/shadcn/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAssociatesQuery } from '../hooks/use-associates-query';

export interface AssociateSearchOption {
  id: string;
  cedula: string;
  fullname: string;
}

interface AssociateSearchSelectProps {
  /** Texto inicial mostrado en el input (ej. al editar) */
  initialLabel?: string;
  onSelect: (associate: AssociateSearchOption | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Selector de asociados con búsqueda en el servidor (por cédula o nombre).
 * Evita cargar todos los asociados en memoria.
 */
export function AssociateSearchSelect({
  initialLabel = '',
  onSelect,
  placeholder = 'Buscar asociado por cédula o nombre...',
  className,
  disabled = false,
}: AssociateSearchSelectProps) {
  const [term, setTerm] = useState(initialLabel);
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const { data, isLoading, isFetching } = useAssociatesQuery(
    { page: 1, limit: 20, search: debounced },
    debounced.length >= 2,
  );
  const results = data?.data || [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (associate: AssociateSearchOption) => {
    onSelect(associate);
    setTerm(`${associate.cedula} - ${associate.fullname}`);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setTerm('');
    setDebounced('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          if (e.target.value.trim() === '') handleClear();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="pl-8"
        disabled={disabled}
      />

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {debounced.length < 2 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Escriba al menos 2 caracteres para buscar...
            </div>
          ) : isLoading || isFetching ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Sin resultados
            </div>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() =>
                  handleSelect({
                    id: a.id,
                    cedula: a.cedula,
                    fullname: a.fullname,
                  })
                }
              >
                <span className="font-mono shrink-0">{a.cedula}</span>
                <span className="truncate">{a.fullname}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
