import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Textarea } from '@repo/shadcn/textarea';
import { Label } from '@repo/shadcn/label';
import {
  SelectSearchable,
} from '@repo/shadcn/select-searchable';
import { Upload } from 'lucide-react';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useUploadExcelMutation } from '../hooks/use-bank-reconciliation-query';

interface BankReconciliationUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankReconciliationUploadModal({
  open,
  onOpenChange,
}: BankReconciliationUploadModalProps) {
  const { data: accountsData } = useBankAccountAll();
  const uploadMutation = useUploadExcelMutation();

  const [bankAccountId, setBankAccountId] = useState('');
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [statementEndingBalance, setStatementEndingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = () => {
    if (!bankAccountId || !statementDate || !statementEndingBalance || !file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankAccountId', bankAccountId);
    formData.append('statementDate', statementDate);
    formData.append('statementEndingBalance', statementEndingBalance);
    if (notes) formData.append('notes', notes);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setBankAccountId('');
    setStatementDate(new Date().toISOString().split('T')[0]);
    setStatementEndingBalance('');
    setNotes('');
    setFile(null);
  };

  const isValid =
    bankAccountId && statementDate && statementEndingBalance && file;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Importar Conciliación desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) con los movimientos del extracto
            bancario. El formato esperado es: Fecha | Descripción | Categoría |
            Referencia | Método | Débito | Crédito | Fecha Valor | Nota
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cuenta Bancaria</Label>
            <SelectSearchable
              options={(accountsData?.data || []).map((account) => ({
                value: account.id,
                label: `${account.accountName || ''} - ${account.accountNumber}`,
              }))}
              onValueChange={(v) => setBankAccountId(v || '')}
              placeholder="Buscar cuenta bancaria..."
              value={bankAccountId || undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Corte</Label>
              <Input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Saldo Final del Extracto</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={statementEndingBalance}
                onChange={(e) => setStatementEndingBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={() => {
              const input = document.getElementById(
                'excel-file-input',
              ) as HTMLInputElement;
              input?.click();
            }}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) setFile(selected);
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra el archivo Excel aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: .xlsx, .xls
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || uploadMutation.isPending}
            >
              {uploadMutation.isPending
                ? 'Importando...'
                : 'Importar y Crear Conciliación'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
