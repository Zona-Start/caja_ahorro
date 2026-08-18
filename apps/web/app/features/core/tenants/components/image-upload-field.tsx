import { Button } from '@repo/shadcn/button';
import { ImagePlus } from 'lucide-react';
import { useRef } from 'react';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (file: File) => void;
  uploading?: boolean;
  disabled?: boolean;
  accept?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  uploading,
  disabled,
  accept = 'image/*',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
            e.target.value = '';
          }}
        />
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-10 w-10 rounded border object-contain"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Sin imagen</span>
        )}
      </div>
    </div>
  );
}
