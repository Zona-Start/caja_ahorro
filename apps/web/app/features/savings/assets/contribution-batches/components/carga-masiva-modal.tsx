'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@repo/shadcn/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Checkbox } from '@repo/shadcn/checkbox';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  CheckCircle2 as CheckCircleIcon,
  Download,
  FileSpreadsheet,
  UploadCloud,
  X,
  Loader2,
  Upload,
} from 'lucide-react';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import {
  useBulkUploadIndividualLoad,
  useDownloadTemplateIndividualLoad,
} from '../../individual-load/hooks/use-individual-load-mutation';
import {
  bulkFormSchema,
  type BulkLoadAsset,
} from '../../individual-load/schemas/individual-load-schema';
import { QUERY_KEYS } from '@/lib/query-keys';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  MOBILE_PAYMENT: 'Pago Móvil',
  DEPOSIT: 'Depósito',
  CHECK: 'Cheque',
  CASH: 'Efectivo',
  OTHER: 'Otro',
};

export function CargaMasivaModal({ open, onClose }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    message: string;
    processedCount: number;
    skippedRows?: { cedula: string; monto: number }[];
  } | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [includeBankingDetails, setIncludeBankingDetails] = useState(false);

  const form = useForm<BulkLoadAsset>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      bankAccountId: undefined,
      paymentMethod: undefined,
      referenceNumber: undefined,
      transactionDate: new Date(),
      description: '',
    },
  });

  const { mutate: uploadBulk, isPending: isUploading } =
    useBulkUploadIndividualLoad((data: any) => {
      setProcessedResult(data);
      setSelectedFile(null);
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionBatches.all });
    });

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadTemplateIndividualLoad();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
      if (!isExcel) {
        toast.error({ title: 'Archivo inválido', description: 'Solo archivos Excel (.xlsx, .xls)' });
        return;
      }
      setSelectedFile(file);
      setProcessedResult(null);
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
      toast.error({ title: 'Archivo requerido', description: 'Seleccione un archivo Excel.' });
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmSubmit = form.handleSubmit((data: BulkLoadAsset) => {
    const formData = new FormData();
    formData.append('file', selectedFile!);
    if (data.bankAccountId) formData.append('bankAccountId', data.bankAccountId);
    if (data.paymentMethod) formData.append('paymentMethod', data.paymentMethod);
    if (data.referenceNumber) formData.append('referenceNumber', data.referenceNumber);
    formData.append('transactionDate', data.transactionDate.toISOString());
    if (data.description) formData.append('description', data.description);
    uploadBulk(formData);
    setConfirmOpen(false);
  });

  const handleReset = () => {
    setSelectedFile(null);
    setProcessedResult(null);
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Carga Masiva de Haberes
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {processedResult ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4">
              <CheckCircleIcon className="h-10 w-10 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-green-800">Carga Completada</h3>
                <p className="text-green-700 mt-1">
                  Se procesaron <span className="font-black text-xl mx-1">{processedResult.processedCount}</span> haberes.
                </p>
              </div>
              <Button variant="outline" onClick={handleReset} className="mx-auto">
                Realizar nueva carga
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* FILE UPLOAD */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                  } ${selectedFile ? 'bg-primary/5 border-primary/50' : ''}`}
                >
                  <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <CheckCircleIcon className="w-8 h-8 text-primary" />
                      <p className="text-sm font-bold text-primary">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Arrastra tu archivo o haz clic</p>
                      <p className="text-xs text-muted-foreground">Archivos Excel (.xlsx, .xls)</p>
                    </>
                  )}
                </div>

                {/* BANK DATA TOGGLE */}
                <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/20">
                  <Checkbox
                    id="include-banking-modal"
                    checked={includeBankingDetails}
                    onCheckedChange={(c) => setIncludeBankingDetails(Boolean(c))}
                  />
                  <label htmlFor="include-banking-modal" className="text-sm font-medium text-primary cursor-pointer">
                    Datos Bancarios (Opcional)
                  </label>
                </div>

                {includeBankingDetails && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="bankAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Cuenta Receptora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {bankAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.accountName}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transactionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Fecha Depósito</FormLabel>
                            <FormControl><CustomCalendar value={field.value} onChange={field.onChange} disabled={isUploading} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Método</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger></FormControl>
                              <SelectContent>{Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Nro. Referencia</FormLabel>
                            <FormControl><Input placeholder="Ej. 12345678" {...field} disabled={isUploading} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Observaciones</FormLabel>
                          <FormControl><Textarea placeholder="Descripción..." className="resize-none h-16 text-sm" {...field} disabled={isUploading} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5"
                    onClick={() => downloadTemplate()} disabled={isDownloading || isUploading}>
                    <Download className="h-4 w-4" /> Plantilla
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" disabled={!selectedFile || isUploading} className="gap-1.5">
                      {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</> : <><Upload className="h-4 w-4" /> Cargar Archivo</>}
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3 rounded-lg flex gap-2 text-amber-800 dark:text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase">Instrucciones:</p>
                    <p>1. Celda A1/B1: <code className="bg-amber-200/50 px-1 rounded font-bold">tipo | APORTE EMPLEADOS</code></p>
                    <p>2. Celda C1/D1: <code className="bg-amber-200/50 px-1 rounded font-bold">fecha | YYYY-MM-DD</code></p>
                    <p>3. Fila 2: <code className="bg-amber-200/50 px-1 rounded font-bold">cedula</code> y <code className="bg-amber-200/50 px-1 rounded font-bold">monto</code></p>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>

        <AlertModal
          isOpen={isConfirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirmSubmit}
          loading={isUploading}
          title="Confirmar Carga Masiva"
          description={`¿Procesar el archivo ${selectedFile?.name}? Se cargarán los haberes de los asociados encontrados.`}
        />
      </DialogContent>
    </Dialog>
  );
}
