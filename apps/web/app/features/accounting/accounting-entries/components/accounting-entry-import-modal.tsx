import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { cn } from '@repo/shadcn/lib/utils';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import { useImportAccountingEntryMutation } from '../hooks/use-accounting-entries-mutation';

interface AccountingEntryImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountingEntryImportModal({
  open,
  onOpenChange,
}: AccountingEntryImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const importMutation = useImportAccountingEntryMutation();

  const reset = () => {
    setFile(null);
    setIsDragging(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await AccountingEntriesService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_asiento_contable.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo descargar la plantilla.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      await importMutation.mutateAsync(file);
      handleOpenChange(false);
    } catch {
      // error handled by mutation onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Importar Asiento Contable</DialogTitle>
          <DialogDescription>
            Carga un asiento contable desde un archivo Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar plantilla
            </Button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-primary/50',
            )}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Quitar
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Arrastra el archivo aquí o haz clic para buscarlo
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo archivos .xlsx
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">La plantilla debe contener:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong>Línea 1:</strong> descripción general del asiento y
                fecha.
              </li>
              <li>
                <strong>Línea 2:</strong> columnas{' '}
                <code>cuenta</code>, <code>auxiliar_socio</code>,{' '}
                <code>debitos</code>, <code>creditos</code>.
              </li>
              <li>
                <strong>Líneas siguientes:</strong> una fila por cada línea del
                asiento.
              </li>
              <li>
                La cuenta debe expresarse con puntos (ej.{' '}
                <code>311.03.00.00.003</code>).
              </li>
              <li>
                <code>auxiliar_socio</code> es opcional: si se indica, debe ser
                la cédula del asociado.
              </li>
              <li>Los débitos y créditos deben estar cuadrados.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importando...' : 'Importar asiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
