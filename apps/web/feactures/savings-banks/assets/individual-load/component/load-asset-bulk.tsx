'use client';

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
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  useBulkUploadIndividualLoad,
  useDownloadTemplateIndividualLoad,
} from '../hooks/use-mutation-indvidual-load';

export function LoadAssetsBulk() {
  const toast = useToastSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    message: string;
    processedCount: number;
  } | null>(null);

  const { mutate: uploadBulk, isPending: isUploading } =
    useBulkUploadIndividualLoad((data) => {
      setProcessedResult(data);
      setSelectedFile(null);
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
      handleFileChange({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    uploadBulk(formData);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-dashed border-2 bg-muted/10 tracking-tight">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-black">
          Carga Masiva de Haberes
        </CardTitle>
        <CardDescription>
          Arrastra tu archivo Excel aquí o haz clic para seleccionar
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
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer relative min-h-[200px]
                ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                }
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
                <div className="flex flex-col items-center text-center space-y-3">
                  <FileSpreadsheet className="w-12 h-12 text-primary animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Quitar archivo
                  </Button>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">
                    Arrastra tu archivo aquí
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Soporta formatos .xlsx y .xls
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleDownloadTemplate}
                disabled={isDownloading || isUploading}
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </Button>

              <Button
                disabled={!selectedFile || isUploading || isDownloading}
                onClick={handleUpload}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Subir y Procesar
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase tracking-widest">
              Importante: Estructura del archivo
            </p>
            <p>
              La plantilla debe contener en la 1ra fila el identificador del
              proceso (Ej:{' '}
              <code className="bg-amber-200/50 px-1 rounded font-bold">
                tipo
              </code>{' '}
              |{' '}
              <code className="bg-amber-200/50 px-1 rounded font-bold">
                5501
              </code>{' '}
              o{' '}
              <code className="bg-amber-200/50 px-1 rounded font-bold">
                5800
              </code>
              ).
            </p>
            <p>
              La 2da fila debe definir los encabezados:{' '}
              <code className="bg-amber-200/50 px-1 rounded font-bold">
                cedula
              </code>{' '}
              y{' '}
              <code className="bg-amber-200/50 px-1 rounded font-bold">
                monto
              </code>
              .
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
