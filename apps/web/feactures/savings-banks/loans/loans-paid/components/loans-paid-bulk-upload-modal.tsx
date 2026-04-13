'use client';

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  useBulkUploadLoanPaid,
  useDownloadTemplateLoanPaid,
} from '../hooks/use-loans-paid-mutation';

interface BulkUploadResult {
  success: { cedula: string; ref: string }[];
  errors: { cedula: string; error: string }[];
  totalProcessed: number;
}

interface LoansPaidBulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoansPaidBulkUploadModal({
  open,
  onOpenChange,
}: LoansPaidBulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { mutate: uploadFile, isPending } = useBulkUploadLoanPaid((data) => {
    setResult(data);
    setSelectedFile(null);
  });

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadTemplateLoanPaid();

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setUploadError(null);
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setResult(null);

    const isExcel =
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isExcel) {
      setUploadError('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    uploadFile(formData, {
      onError: (err) => {
        setUploadError(
          err instanceof Error
            ? err.message
            : 'Error procesando la carga. Contacte al administrador.',
        );
      },
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
            Carga Masiva de Pagos
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel con los datos de los pagos a procesar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resultado de la carga */}
          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3 dark:border-green-800 dark:bg-green-950/30">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Carga procesada: {result.totalProcessed} registros exitosos
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Errores encontrados ({result.errors.length}):
                  </p>
                  <div className="max-h-[120px] overflow-y-auto rounded border border-destructive/20 bg-white/50 p-2 dark:bg-zinc-900/50">
                    {result.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-destructive leading-normal border-b last:border-0 py-1 border-destructive/10"
                      >
                        <span className="font-semibold">{err.cedula}:</span>{' '}
                        {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error de carga general */}
          {uploadError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Zona de arrastre */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
                cursor-pointer transition-all duration-200 min-h-[160px] p-6
                ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleInputChange}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="flex items-center gap-3 w-full justify-center">
                    <FileSpreadsheet className="h-8 w-8 text-green-500 shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate max-w-[260px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Arrastra tu archivo aquí o{' '}
                      <span className="text-primary underline-offset-4 hover:underline">
                        haz clic para seleccionar
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo archivos Excel (.xlsx, .xls)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Información importante */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-md flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Información importante:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Las cédulas deben ser de asociados con préstamos activos.
                </li>
                <li>Los montos deben ser numéricos y sin símbolos de moneda.</li>
                <li>
                  El sistema procesará automáticamente los asientos contables.
                </li>
              </ul>
            </div>
          </div>

          {!result && (
            <div className="rounded-md bg-muted/50 border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Columnas requeridas en el archivo:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['cedula', 'monto', 'fecha (AAAA-MM-DD)'].map((col) => (
                  <span
                    key={col}
                    className="rounded-full bg-background border px-2 py-0.5 text-xs font-mono text-muted-foreground"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate()}
            className="gap-2 w-full sm:w-auto"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar Template
          </Button>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
            >
              {result ? 'Cerrar' : 'Cancelar'}
            </Button>

            {!result && (
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || isPending}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Cargar archivo
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
