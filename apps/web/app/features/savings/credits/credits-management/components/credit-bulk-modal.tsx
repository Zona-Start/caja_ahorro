'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Separator } from '@repo/shadcn/separator';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  useBulkUploadCredits,
  useDownloadCreditBulkTemplate,
  type BulkCreditResult,
} from '../hooks/use-credits-management-mutation';

interface CreditBulkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REQUIRED_FIELDS = [
  { field: 'Cédula del Asociado', description: 'Obligatorio. Debe existir y estar activo.' },
  { field: 'Tipo de Crédito', description: 'Obligatorio. Debe coincidir con un tipo configurado.' },
  { field: 'Monto', description: 'Obligatorio. Mayor a 0.' },
  { field: 'Tasa de Interés Anual (%)', description: 'Opcional. Por defecto la del tipo de crédito.' },
  { field: '% Gasto Administrativo', description: 'Opcional. Por defecto el del tipo de crédito.' },
  { field: 'Modalidad de Pago', description: 'Opcional. PLAZOS (quincenal) o CUOTAS (mensual).' },
  { field: 'Cantidad (Plazos o Cuotas)', description: 'Opcional. Entero mayor a 0.' },
  { field: 'Fecha de Inicio', description: 'Opcional. Formato AAAA-MM-DD o DD/MM/AAAA.' },
  { field: 'Observaciones', description: 'Opcional. Texto libre.' },
];

export function CreditBulkModal({ open, onOpenChange }: CreditBulkModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkCreditResult | null>(null);

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadCreditBulkTemplate();

  const { mutate: uploadBulk, isPending: isUploading } = useBulkUploadCredits(
    (data) => {
      setResult(data);
      setFile(null);
    },
  );

  const isExcel = useCallback((f: File) => {
    return (
      f.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls')
    );
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      if (!isExcel(selected)) {
        setFile(null);
        return;
      }
      setResult(null);
      setFile(selected);
    },
    [isExcel],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (!dropped) return;
      if (!isExcel(dropped)) return;
      setResult(null);
      setFile(dropped);
    },
    [isExcel],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value) {
        handleClear();
      }
      onOpenChange(value);
    },
    [handleClear, onOpenChange],
  );

  const handleSubmit = useCallback(() => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadBulk(formData);
    setConfirmOpen(false);
  }, [file, uploadBulk]);

  const hasFailures = useMemo(
    () => (result?.failureCount ?? 0) > 0,
    [result],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Carga Masiva de Créditos
            </DialogTitle>
            <DialogDescription>
              Cargue un archivo Excel para crear varios créditos a la vez. Las
              filas con errores no detienen la carga, se reportan al finalizar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Descargar plantilla */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Plantilla de carga</p>
                  <p className="text-muted-foreground text-xs">
                    Descargue el formato e ingrese los datos requeridos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Descargar
              </Button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <CloudUpload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                Arrastre el archivo aquí o haga clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: .xlsx, .xls
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Observaciones de campos requeridos */}
            {!result && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#3098F2]" />
                  <span className="text-sm font-semibold uppercase text-muted-foreground">
                    Campos del archivo
                  </span>
                </div>
                <ul className="space-y-1">
                  {REQUIRED_FIELDS.map((f) => (
                    <li key={f.field} className="text-xs flex gap-1.5">
                      <span className="font-medium shrink-0">{f.field}:</span>
                      <span className="text-muted-foreground">
                        {f.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resultados */}
            {result && (
              <div className="space-y-3">
                <Separator />
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {result.successCount}{' '}
                    creado(s)
                  </span>
                  {hasFailures && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                      <XCircle className="h-3 w-3" /> {result.failureCount} con
                      error
                    </span>
                  )}
                </div>

                {result.successes.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-semibold mb-2">
                      Créditos creados
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="py-1 text-left">Fila</th>
                            <th className="py-1 text-left">Cédula</th>
                            <th className="py-1 text-left">Asociado</th>
                            <th className="py-1 text-left">Referencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.successes.map((s) => (
                            <tr
                              key={`${s.row}-${s.cedula}`}
                              className="border-b last:border-0"
                            >
                              <td className="py-1">{s.row}</td>
                              <td className="py-1 font-mono">{s.cedula}</td>
                              <td className="py-1">{s.associateName}</td>
                              <td className="py-1 font-mono">{s.reference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {hasFailures && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-semibold mb-2 text-destructive">
                      Filas con error
                    </p>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="py-1 text-left">Fila</th>
                            <th className="py-1 text-left">Cédula</th>
                            <th className="py-1 text-left">Asociado</th>
                            <th className="py-1 text-left">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.failures.map((f, i) => (
                            <tr
                              key={`${f.row}-${i}`}
                              className="border-b last:border-0"
                            >
                              <td className="py-1">{f.row}</td>
                              <td className="py-1 font-mono">{f.cedula}</td>
                              <td className="py-1">{f.associateName || '—'}</td>
                              <td className="py-1 text-destructive">
                                {f.error}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
              >
                {result ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!result && (
                <Button
                  type="button"
                  size="sm"
                  disabled={!file || isUploading}
                  onClick={() => setConfirmOpen(true)}
                  className="bg-blue-600 gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1 h-4 w-4" /> Cargar Créditos
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        loading={isUploading}
        title="Confirmar carga masiva"
        description="¿Está seguro que desea procesar el archivo y crear los créditos? Los registros válidos se aprobarán automáticamente."
      />
    </>
  );
}
