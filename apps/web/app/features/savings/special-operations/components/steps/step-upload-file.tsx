'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { cn } from '@repo/shadcn/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  useDownloadSpecialOperationTemplateMutation,
  useSpecialOperationPreviewMutation,
} from '../../hooks/use-special-operations';
import { useSpecialOperationWizardStore } from '../../store/special-operation-wizard.store';

export function StepUploadFile() {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const operationType = useSpecialOperationWizardStore(
    (state) => state.operationType,
  );
  const operationDate = useSpecialOperationWizardStore(
    (state) => state.operationDate,
  );
  const file = useSpecialOperationWizardStore((state) => state.file);
  const setFile = useSpecialOperationWizardStore((state) => state.setFile);
  const setOperationDate = useSpecialOperationWizardStore(
    (state) => state.setOperationDate,
  );
  const setPreview = useSpecialOperationWizardStore(
    (state) => state.setPreview,
  );
  const next = useSpecialOperationWizardStore((state) => state.next);
  const back = useSpecialOperationWizardStore((state) => state.back);

  const previewMutation = useSpecialOperationPreviewMutation();
  const downloadTemplate = useDownloadSpecialOperationTemplateMutation();

  const handleFile = (selected: File | null) => {
    if (!selected) return;

    if (!/\.xlsx$/i.test(selected.name)) {
      toast.error({
        title: 'Archivo inválido',
        description: 'Selecciona un archivo Excel con extensión .xlsx.',
      });
      return;
    }

    if (selected.size === 0) {
      toast.error({
        title: 'Archivo vacío',
        description: 'El archivo seleccionado no contiene información.',
      });
      return;
    }

    setFile(selected);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate.mutate(undefined, {
      onSuccess: (base64) => {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let index = 0; index < binaryString.length; index++) {
          bytes[index] = binaryString.charCodeAt(index);
        }

        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'plantilla-operaciones-especiales.xlsx';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        toast.success({
          title: 'Plantilla descargada',
          description: 'El archivo Excel fue generado correctamente.',
        });
      },
      onError: () => {
        toast.error({
          title: 'Error',
          description: 'No se pudo generar la plantilla.',
        });
      },
    });
  };

  const handlePreview = () => {
    if (!file || !operationType) {
      toast.error({
        title: 'Datos incompletos',
        description: 'Selecciona un archivo y una fecha de operación.',
      });
      return;
    }

    previewMutation.mutate(
      { file, operationType, operationDate },
      {
        onSuccess: (preview) => {
          setPreview(preview);
          if (preview.summary.errorRows > 0) {
            toast.warning({
              title: 'Se encontraron errores',
              description: `${preview.summary.errorRows} fila(s) presentan errores y deben corregirse.`,
            });
          }
          next();
        },
        onError: (error: any) => {
          toast.error({
            title: 'No se pudo procesar el archivo',
            description:
              error?.response?.data?.message ??
              'Verifica el archivo e inténtalo nuevamente.',
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cargar archivo</h2>
        <p className="text-sm text-muted-foreground">
          Descarga la plantilla, completa las cédulas y carga el Excel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
          )}
        >
          <UploadCloud className="h-9 w-9 text-muted-foreground" />
          <div>
            <p className="font-medium">
              Arrastra el archivo aquí o haz clic para seleccionarlo
            </p>
            <p className="text-xs text-muted-foreground">
              Formato permitido: .xlsx
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(event) =>
              handleFile(event.target.files?.[0] ?? null)
            }
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <Label htmlFor="operation-date">Fecha de operación</Label>
          <Input
            id="operation-date"
            type="date"
            value={operationDate}
            onChange={(event) => setOperationDate(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDownloadTemplate}
            disabled={downloadTemplate.isPending}
          >
            {downloadTemplate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar plantilla
          </Button>
        </div>
      </div>

      {file && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setFile(null)}
            aria-label="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button
          onClick={handlePreview}
          disabled={!file || previewMutation.isPending}
        >
          {previewMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Procesar archivo
        </Button>
      </div>
    </div>
  );
}
