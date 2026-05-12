import { AlertModal } from '@/components/modal/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
  X,
  Loader2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { Textarea } from '@repo/shadcn/textarea';
import { Checkbox } from '@repo/shadcn/checkbox';
import {
  useBulkUploadIndividualLoad,
  useDownloadTemplateIndividualLoad,
} from '../hooks/use-individual-load-mutation';
import { bulkFormSchema, type BulkLoadAsset } from '../schemas/individual-load-schema';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Transferencia bancaria',
  MOBILE_PAYMENT: 'Pago Móvil',
  DEPOSIT: 'Depósito',
  CHECK: 'Cheque',
  CASH: 'Efectivo',
  OTHER: 'Otro',
};

export function LoadAssetsBulk() {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    message: string;
    processedCount: number;
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
    useBulkUploadIndividualLoad((data) => {
      setProcessedResult(data);
      setSelectedFile(null);
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
    });

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadTemplateIndividualLoad();

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
      setProcessedResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
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

  const onConfirmSubmit = form.handleSubmit((data: BulkLoadAsset) => {
    const formData = new FormData();
    formData.append('file', selectedFile!);
    
    if (data.bankAccountId) {
      formData.append('bankAccountId', data.bankAccountId.toString());
    }
    if (data.paymentMethod) {
      formData.append('paymentMethod', data.paymentMethod);
    }
    if (data.referenceNumber) {
      formData.append('referenceNumber', data.referenceNumber);
    }
    formData.append('transactionDate', data.transactionDate.toISOString());
    if (data.description) {
      formData.append('description', data.description);
    }

    uploadBulk(formData);
    setConfirmOpen(false);
  });

  const handleReset = () => {
    setSelectedFile(null);
    setProcessedResult(null);
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmSubmit}
        loading={isUploading}
        title="Confirmar Carga Masiva"
        description={`¿Está seguro que desea procesar este lote de haberes? Se registrarán movimientos para todos los asociados incluidos en el archivo ${selectedFile?.name}.`}
      />
      <Card className="border-dashed border-2 bg-muted/10 tracking-tight">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-black">
          Carga Masiva de Haberes
        </CardTitle>
        <CardDescription>
          Seleccione el archivo y {includeBankingDetails ? 'complete los datos bancarios del depósito unificado' : 'opcionalmente agregue datos bancarios'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {processedResult ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4 dark:border-green-800 dark:bg-green-950/30 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900 border-4 border-green-50 dark:border-green-950/50">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                ¡Carga Completada!
              </h3>
              <p className="text-green-700 dark:text-green-400 mt-1">
                Se han procesado correctamente{' '}
                <span className="font-black text-xl mx-1">
                  {processedResult.processedCount}
                </span>{' '}
                haberes.
              </p>
            </div>
            <Button variant="outline" onClick={handleReset} className="mx-auto">
              Realizar nueva carga
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        Archivo listo para procesar ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
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

              <div className="flex items-center gap-3 border rounded-lg p-4 bg-muted/20">
                <Checkbox
                  id="include-banking"
                  checked={includeBankingDetails}
                  onCheckedChange={(checked) => setIncludeBankingDetails(Boolean(checked))}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="include-banking"
                    className="text-sm font-bold text-primary cursor-pointer"
                  >
                    Datos Bancarios (Opcional)
                  </label>
                  <p className="text-[10px] text-muted-foreground italic">
                    {includeBankingDetails 
                      ? 'Estos datos se aplicarán a todos los registros del archivo' 
                      : 'Active para agregar datos bancarios al lote'}
                  </p>
                </div>
              </div>

              {includeBankingDetails && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Cuenta Receptora
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value ? String(field.value) : undefined}
                          disabled={isUploading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione cuenta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={String(account.id)}>
                                {account.accountName} - {account.accountNumber.slice(-4)}
                              </SelectItem>
                            ))}
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
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Fecha del Depósito
                        </FormLabel>
                        <FormControl>
                          <CustomCalendar
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isUploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Método de Pago
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isUploading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
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
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Nro. Referencia
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej. 12345678"
                            {...field}
                            disabled={isUploading}
                          />
                        </FormControl>
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
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                        Observaciones (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción breve del lote..."
                          className="resize-none h-16 text-sm"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </>
              )}


              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 h-11 px-6"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading || isUploading}
                >
                  <Download className="w-4 w-4" />
                  Plantilla
                </Button>

                <Button
                  type="submit"
                  disabled={!selectedFile || isUploading || isDownloading}
                  className="flex items-center gap-2 h-11 px-8 font-bold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 w-4 animate-spin" />
                      Procesando Lote...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 w-4" />
                      Ejecutar Carga Masiva
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-[10px] space-y-1">
            <p className="font-bold uppercase tracking-widest text-[11px]">
              Instrucciones de la Plantilla:
            </p>
            <p>
              1. Fila 1 Col A/B: <code className="bg-amber-200/50 px-1 rounded font-bold">tipo | APORTE EMPLEADOS</code> o <code className="bg-amber-200/50 px-1 rounded font-bold">DESCUENTOS CAJA</code>.
            </p>
             <p>
              2. Fila 1 Col C/D: <code className="bg-amber-200/50 px-1 rounded font-bold">fecha | YYYY-MM-DD</code>.
            </p>
            <p>
              3. Fila 2: Encabezados <code className="bg-amber-200/50 px-1 rounded font-bold">cedula</code> y <code className="bg-amber-200/50 px-1 rounded font-bold">monto</code>.
            </p>
            <p className="font-bold pt-1 italic underline">
              * El archivo debe ser coherente con el depósito bancario registrado.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}