import { useToastSystem } from '@/hooks/use-toast-system';
import { storageService } from '@/lib/storage-service';
import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
}

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

export function FileUpload({
  value,
  onChange,
  folder = 'general',
  accept = 'image/*,application/pdf',
  maxSizeMb = 10,
  disabled = false,
  className,
}: FileUploadProps) {
  const { error: toastError } = useToastSystem();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!value) setFileName(null);
  }, [value]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;

      const isAllowed =
        file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isAllowed) {
        toastError('Solo se permiten imágenes o archivos PDF.');
        return;
      }

      if (file.size > maxSizeMb * 1024 * 1024) {
        toastError(`El archivo supera el tamaño máximo de ${maxSizeMb} MB.`);
        return;
      }

      try {
        setIsUploading(true);
        setFileName(file.name);
        const result = await storageService.upload(file, folder);
        onChange(result.url);
      } catch {
        setFileName(null);
        toastError('No se pudo subir el archivo. Intenta de nuevo.');
      } finally {
        setIsUploading(false);
      }
    },
    [folder, maxSizeMb, onChange, toastError],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleBrowse = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  if (value) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-muted/30 p-3',
          className,
        )}
      >
        {isImageUrl(value) ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-background"
          >
            <img
              src={value}
              alt="Comprobante"
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-background">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {fileName ?? 'Comprobante cargado'}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Ver archivo
          </a>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={() => {
            onChange('');
            setFileName(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleBrowse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleBrowse();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40',
          (disabled || isUploading) && 'pointer-events-none opacity-60',
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Subiendo archivo...</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              Arrastra un archivo o haz clic para subir
            </p>
            <p className="text-xs text-muted-foreground">
              Imagen o PDF · máx. {maxSizeMb} MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
