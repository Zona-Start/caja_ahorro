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
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Landmark,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AlertModal } from '@/components/shared/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import {
  useBulkUploadSettlementMutation,
  useDownloadSettlementTemplateMutation,
} from '../hooks/use-settlement-query';
import { type SettlementBulkResponse } from '../schemas/settlement-api-response';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettlementBulkModal({ open, onOpenChange }: Props) {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SettlementBulkResponse | null>(null);

  // Datos bancarios OPCIONALES: si se elige una cuenta se crea el movimiento
  // bancario; si no, la liquidación se desembolsa igualmente sin banco.
  const [bankAccountId, setBankAccountId] = useState('');
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [bankReference, setBankReference] = useState('');

  const { data: bankAccountsData } = useBankAccountAllQuery();
  const bankAccounts = bankAccountsData?.data ?? [];

  const { mutate: uploadBulk, isPending: isUploading } =
    useBulkUploadSettlementMutation();

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadSettlementTemplateMutation();

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
          description: 'Solo se permiten archivos Excel (.xlsx, .xls)',
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(undefined, {
      onSuccess: (base64: string) => {
        try {
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'plantilla-liquidaciones.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success({
            title: 'Plantilla descargada',
            description: 'El archivo Excel ha sido generado con éxito.',
          });
        } catch {
          toast.error({
            title: 'Error',
            description: 'Error al procesar el archivo de plantilla.',
          });
        }
      },
      onError: () => {
        toast.error({
          title: 'Error',
          description: 'Error al descargar la plantilla. Intente de nuevo.',
        });
      },
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setBankAccountId('');
    setTransferDate(new Date());
    setBankReference('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const onSubmit = () => {
    if (!selectedFile) {
      toast.error({
        title: 'Archivo requerido',
        description: 'Por favor, seleccione un archivo Excel para procesar.',
      });
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmSubmit = () => {
    const formData = new FormData();
    formData.append('file', selectedFile!);

    // Datos bancarios opcionales: si hay cuenta se crea el movimiento bancario.
    if (bankAccountId) {
      formData.append('bankAccountId', bankAccountId);
      formData.append('transferDate', transferDate.toISOString());
      if (bankReference) formData.append('bankReference', bankReference);
    }

    uploadBulk(formData, {
      onSuccess: (data) => {
        setResult(data);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success({
          title: 'Carga masiva completada',
          description: `Se procesaron ${data.totalProcessed} liquidaciones${
            data.totalDisbursed ? ` y se desembolsaron ${data.totalDisbursed}` : ''
          }.`,
        });
      },
      onError: (error: Error) => {
        toast.error({
          title: 'Error de carga',
          description: error.message || 'Error al procesar la carga masiva.',
        });
      },
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmSubmit}
        loading={isUploading}
        title="Confirmar Carga Masiva"
        description={`¿Está seguro que desea procesar las liquidaciones del archivo ${selectedFile?.name}? Se crearán, procesarán y desembolsarán${
          bankAccountId ? ' con movimiento bancario' : ' sin movimiento bancario (no se indicó cuenta)'
        }.`}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Carga Masiva de
              Liquidaciones
            </DialogTitle>
            <DialogDescription>
              Cargue un archivo Excel con las cédulas de los asociados. Las
              liquidaciones se crean, se procesan y, opcionalmente, se
              desembolsan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {result ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4 dark:border-green-800 dark:bg-green-950/30">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                    Carga Completada
                  </h3>
                  <p className="text-green-700 dark:text-green-400 mt-1">
                    Se procesaron{' '}
                    <span className="font-black text-xl mx-1">
                      {result.totalProcessed}
                    </span>{' '}
                    liquidaciones correctamente.
                  </p>
                  {!!result.totalDisbursed && (
                    <p className="text-green-700 dark:text-green-400 mt-1">
                      Se desembolsaron{' '}
                      <span className="font-black text-xl mx-1">
                        {result.totalDisbursed}
                      </span>{' '}
                      liquidaciones.
                    </p>
                  )}
                  {result.bankMovementCreated === false && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Se desembolsaron sin movimiento bancario (no se indicó
                      cuenta).
                    </p>
                  )}
                  {result.errors.length > 0 && (
                    <p className="text-red-700 dark:text-red-400 mt-1">
                      <span className="font-black text-lg mx-1">
                        {result.errors.length}
                      </span>{' '}
                      cédula(s) no pudieron procesarse.
                    </p>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div className="text-left border rounded-md p-3 bg-red-50 dark:bg-red-950/30 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">
                      No procesadas ({result.errors.length}):
                    </p>
                    {result.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-red-700 dark:text-red-300"
                      >
                        <span className="font-mono">{err.cedula}</span>:{' '}
                        {err.error}
                      </p>
                    ))}
                  </div>
                )}

                {(() => {
                  const disburseErrors = (result.success ?? []).filter(
                    (s) => s.disburseError,
                  );
                  if (disburseErrors.length === 0) return null;
                  return (
                    <div className="text-left border rounded-md p-3 bg-amber-50 dark:bg-amber-950/30 max-h-48 overflow-y-auto">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
                        Procesadas pero no desembolsadas ({disburseErrors.length}
                        ):
                      </p>
                      {disburseErrors.map((s, i) => (
                        <p
                          key={i}
                          className="text-xs text-amber-700 dark:text-amber-300"
                        >
                          <span className="font-mono">{s.cedula}</span>:{' '}
                          {s.disburseError}
                        </p>
                      ))}
                    </div>
                  );
                })()}

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mx-auto"
                >
                  Realizar nueva carga
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`
                    flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer relative min-h-[160px]
                    ${
                      dragOver
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${selectedFile ? 'bg-primary/5 border-primary/50' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Archivo listo para procesar (
                          {(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = '';
                        }}
                      >
                        <X className="w-3.5 h-3.5 mr-2" />
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">
                        Arrastra tu archivo aquí o haz clic
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solo archivos Excel (.xlsx, .xls)
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloading || isUploading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 w-4" />
                    )}
                    Descargar Plantilla
                  </Button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold uppercase tracking-widest text-[11px]">
                      Instrucciones de la Plantilla:
                    </p>
                    <p>
                      1. Fila 1 Col A/B:{' '}
                      <code className="bg-amber-200/50 px-1 rounded font-bold">
                        fecha | 2026-01-28
                      </code>{' '}
                      (fecha de la liquidación, aplica a todos).
                    </p>
                    <p>
                      2. Fila 2: Encabezado{' '}
                      <code className="bg-amber-200/50 px-1 rounded font-bold">
                        cedula
                      </code>
                      .
                    </p>
                    <p>
                      3. Fila 3 en adelante: una cédula por fila.
                    </p>
                    <p className="font-bold pt-1 italic underline">
                      * Cada cédula se crea como solicitud, se procesa (cancela
                      préstamos/créditos, genera movimientos, asiento y
                      auditoría) y, si indicó cuenta bancaria, se desembolsa. Las
                      que fallen se listan sin detener el proceso.
                    </p>
                  </div>
                </div>

                {/* Datos bancarios OPCIONALES */}
                <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Landmark className="h-4 w-4" /> Datos bancarios (opcional)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Las liquidaciones siempre se crean, procesan y desembolsan.
                      Si indicas una cuenta bancaria se registrará el movimiento
                      de banco; si lo dejas vacío, se desembolsan sin movimiento
                      bancario.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="md:col-span-2">
                      <span className="text-xs text-muted-foreground">
                        Cuenta Bancaria Origen
                      </span>
                      <Select
                        value={bankAccountId || undefined}
                        onValueChange={setBankAccountId}
                        disabled={isUploading}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccione una cuenta bancaria (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts
                            .filter((b: any) => b.isActive !== false)
                            .map((b: any) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.accountName} - {b.accountNumber}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Fecha de Transferencia
                      </span>
                      <div className="mt-1">
                        <CustomCalendar
                          value={transferDate}
                          onChange={(d) => setTransferDate(d as Date)}
                          disabled={isUploading || !bankAccountId}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Referencia Bancaria
                      </span>
                      <Input
                        className="mt-1"
                        placeholder="Nº de referencia..."
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        disabled={isUploading || !bankAccountId}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={!selectedFile || isUploading || isDownloading}
                    onClick={onSubmit}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" /> Ejecutar Carga
                        Masiva
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
