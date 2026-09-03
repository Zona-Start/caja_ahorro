'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useBulkImportWithdrawals,
  useDownloadWithdrawalTemplate,
} from '../hooks/use-withdrawal-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkResult {
  message: string;
  processedCount: number;
  errorCount: number;
  errors?: { cedula: string; monto: number; error: string }[];
  accountingWarnings?: { cedula: string; warning: string }[];
}

export function WithdrawalBulkModal({ open, onOpenChange }: Props) {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadWithdrawalTemplate();

  const { mutate: uploadBulk, isPending: isUploading } =
    useBulkImportWithdrawals((data) => {
      setResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isExcel =
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
      if (!isExcel) {
        toast.error({
          title: 'Archivo inválido',
          description: 'Solo archivos Excel (.xlsx, .xls)',
        });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const onSubmit = () => {
    if (!selectedFile) {
      toast.error({
        title: 'Archivo requerido',
        description: 'Seleccione un archivo Excel.',
      });
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmSubmit = () => {
    const formData = new FormData();
    formData.append('file', selectedFile!);
    uploadBulk(formData);
    setConfirmOpen(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Carga Masiva de Retiros
          </DialogTitle>
          <DialogDescription>
            Suba un archivo Excel con los retiros a procesar en lote.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {result ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-green-800">Carga Completada</h3>
                <p className="text-green-700 mt-1">
                  Se procesaron{' '}
                  <span className="font-black text-xl mx-1">
                    {result.processedCount}
                  </span>{' '}
                  retiros.
                </p>
                {result.errorCount > 0 && (
                  <p className="text-amber-700 mt-1 font-medium">
                    {result.errorCount} con error.
                  </p>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="text-left rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold uppercase text-amber-800">
                    Errores:
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-800">
                      Cédula {e.cedula}: {e.error}
                    </p>
                  ))}
                </div>
              )}

              {result.accountingWarnings &&
                result.accountingWarnings.length > 0 && (
                  <div className="text-left rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 max-h-40 overflow-y-auto">
                    <p className="text-xs font-bold uppercase text-amber-800">
                      Advertencias contables:
                    </p>
                    {result.accountingWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-800">
                        Cédula {w.cedula}: {w.warning}
                      </p>
                    ))}
                  </div>
                )}

              <Button variant="outline" onClick={handleReset} className="mx-auto">
                Realizar nueva carga
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/30 hover:border-primary/50'
                } ${selectedFile ? 'bg-primary/5 border-primary/50' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                    <p className="text-sm font-bold text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Arrastra tu archivo o haz clic
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Archivos Excel (.xlsx, .xls)
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => downloadTemplate()}
                  disabled={isDownloading || isUploading}
                >
                  <Download className="h-4 w-4" /> Descargar Plantilla
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={!selectedFile || isUploading}
                    className="gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Cargar Archivo
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3 rounded-lg flex gap-2 text-amber-800 dark:text-amber-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold uppercase">Instrucciones de la plantilla:</p>
                  <p>
                    1. Fila 1:{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      A1 = tipo
                    </code>{' '}
                    |{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      B1 = nombre del tipo de retiro
                    </code>
                  </p>
                  <p>
                    2. Fila 1:{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      C1 = fecha
                    </code>{' '}
                    |{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      D1 = YYYY-MM-DD
                    </code>
                  </p>
                  <p>
                    3. Fila 2:{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      cedula
                    </code>{' '}
                    y{' '}
                    <code className="bg-amber-200/50 px-1 rounded font-bold">
                      monto
                    </code>
                  </p>
                  <p>
                    4. Fila 3 en adelante: los datos (cédula en A, monto en B).
                  </p>
                  <p className="text-amber-700 font-medium">
                    Nota: el nombre en B1 debe coincidir exactamente con el tipo de
                    retiro registrado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirmSubmit}
          loading={isUploading}
          title="Confirmar Carga Masiva"
          description={`¿Procesar el archivo ${selectedFile?.name}? Se aplicará el retiro a cada asociado del listado.`}
        />
      </DialogContent>
    </Dialog>
  );
}
