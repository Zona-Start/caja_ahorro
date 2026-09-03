'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AlertModal } from '@/components/shared/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useBulkUploadCreditPayment,
  useDownloadCreditPaymentTemplate,
} from '../hooks/use-credits-paid-mutation';
import type { CreditPaymentBulkResponse } from '../schemas/credits-paid-api-response';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreditPaidBulkModal({ open, onClose }: Props) {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<CreditPaymentBulkResponse | null>(null);

  const { mutate: uploadBulk, isPending: isUploading } =
    useBulkUploadCreditPayment();
  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadCreditPaymentTemplate();

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');
    if (!isExcel) {
      toast.error({
        title: 'Archivo no válido',
        description: 'Seleccione un archivo Excel (.xlsx o .xls)',
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileChange(file);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(undefined, {
      onSuccess: (base64: string) => {
        try {
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
          const blob = new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'plantilla-pagos-creditos.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success({
            title: 'Plantilla descargada',
            description: 'Complete el archivo con cedula y monto.',
          });
        } catch {
          toast.error({
            title: 'Error',
            description: 'No se pudo procesar la plantilla.',
          });
        }
      },
      onError: () =>
        toast.error({
          title: 'Error',
          description: 'No se pudo descargar la plantilla.',
        }),
    });
  };

  const onConfirmSubmit = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    uploadBulk(formData, {
      onSuccess: (data) => {
        setResult(data);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success({
          title: 'Carga masiva completada',
          description: `Se procesaron ${data.totalProcessed ?? 0} pagos.`,
        });
      },
      onError: (error: Error) =>
        toast.error({
          title: 'Error de carga',
          description: error.message || 'No se pudo procesar el archivo.',
        }),
    });
    setConfirmOpen(false);
  };

  const handleClose = () => {
    setResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Carga Masiva de Pagos de
            Créditos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Descripción de parámetros */}
          <div className="rounded-lg border p-4 text-sm space-y-2 bg-muted/30">
            <p className="font-semibold">Parámetros del archivo</p>
            <p>
              La plantilla debe contener las columnas:{' '}
              <span className="font-mono font-bold">cedula</span> y{' '}
              <span className="font-mono font-bold">monto</span>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <span className="font-mono">Fila 1</span>: fecha (aplica a todos
                los pagos) — ej: <span className="font-mono">2026-09-02</span>
              </li>
              <li>
                <span className="font-mono">Fila 2</span>: encabezados
                (cedula, monto)
              </li>
              <li>
                <span className="font-mono">Fila 3+</span>: cedula del asociado
                y monto a abonar
              </li>
            </ul>
            <p className="text-muted-foreground">
              Por cada cédula se busca el socio, luego su crédito activo y se
              aplica el monto a las cuotas correspondientes. Se genera un único
              asiento contable con todos los pagos procesados.
            </p>
          </div>

          {/* Botón descargar plantilla */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadTemplate}
              disabled={isDownloading || isUploading}
            >
              <Download className="h-4 w-4" /> Plantilla
            </Button>
          </div>

          {/* Zona de carga */}
          {!result ? (
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium">
                Arrastre y suelte su archivo Excel aquí
              </p>
              <p className="text-xs text-muted-foreground">
                o haga clic para seleccionar el archivo (.xlsx, .xls)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : null}

          {/* Archivo seleccionado */}
          {selectedFile && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Resultado del procesamiento */}
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center space-y-1">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <p className="font-bold text-green-800">
                  Carga masiva procesada
                </p>
                <p className="text-sm text-green-700">
                  Se procesaron {result.totalProcessed ?? 0} pagos
                  correctamente.
                </p>
              </div>

              {result.accountingWarning && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Advertencia contable: {result.accountingWarning}
                  </span>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Errores ({result.errors.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">
                        - {err.cedula}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Cargar otro archivo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={() => setConfirmOpen(true)}
            className="gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> Cargar Archivo
              </>
            )}
          </Button>
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirmSubmit}
          loading={isUploading}
          title="Confirmar Carga Masiva"
          description={`¿Está seguro de procesar el archivo "${selectedFile?.name}"? Se aplicarán los pagos a los créditos de los asociados indicados.`}
        />
      </DialogContent>
    </Dialog>
  );
}
