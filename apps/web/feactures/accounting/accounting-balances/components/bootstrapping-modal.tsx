'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-query-account-plan';
import {
  useBootstrappingMutation,
  useBootstrappingWithFileMutation,
} from '../hooks/use-accounting-balance-mutation';

interface BootstrappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BalanceItem {
  accountCode: string;
  descripcion: string;
  balance: number;
}

export function BootstrappingModal({
  open,
  onOpenChange,
}: BootstrappingModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [manualBalances, setManualBalances] = useState<BalanceItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('file');

  const bootstrappingMutation = useBootstrappingMutation();
  const bootstrappingFileMutation = useBootstrappingWithFileMutation();

  // Usar el hook para obtener las cuentas contables
  const { data: accountingAccounts, isLoading: isLoadingAccounts } =
    useAccountingAccounts();

  const accountPlans = accountingAccounts?.data || [];

  // Determinar el tamaño del modal según el tab activo
  const modalSize =
    activeTab === 'manual' ? 'sm:max-w-[1000px]' : 'sm:max-w-[500px]';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitFile = async () => {
    if (!file) return;

    try {
      await bootstrappingFileMutation.mutateAsync(file);
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddBalance = () => {
    if (!selectedAccount || !balance) return;

    const account = accountPlans.find(
      (acc) => acc.id?.toString() === selectedAccount,
    );
    if (!account) return;

    const newBalance: BalanceItem = {
      accountCode: account.code,
      descripcion: account.name,
      balance: parseFloat(balance),
    };

    setManualBalances([...manualBalances, newBalance]);
    setSelectedAccount('');
    setBalance('');
  };

  const handleRemoveBalance = (index: number) => {
    setManualBalances(manualBalances.filter((_, i) => i !== index));
  };

  const handleSubmitManual = async () => {
    if (manualBalances.length === 0) return;

    try {
      await bootstrappingMutation.mutateAsync({ balances: manualBalances });
      onOpenChange(false);
      setManualBalances([]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const downloadTemplate = () => {
    // Crear un workbook de Excel
    const wb = XLSX.utils.book_new();

    // Datos de ejemplo
    const data = [
      ['cuenta', 'descripcion', 'saldo'],
      ['1.1.01.001', 'Caja Principal', 50000.0],
      ['2.1.01.001', 'Proveedores', 25000.0],
    ];

    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Carga Inicial');

    // Descargar archivo
    XLSX.writeFile(wb, 'template_carga_inicial.xlsx');
  };

  const getTotalBalance = () => {
    return manualBalances.reduce((sum, item) => sum + item.balance, 0);
  };

  const handleCancel = () => {
    // Limpiar todos los estados
    setFile(null);
    setManualBalances([]);
    setSelectedAccount('');
    setBalance('');
    setActiveTab('file');
    // Cerrar el modal
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Si el modal se está cerrando, limpiar los datos
    if (!isOpen) {
      setFile(null);
      setManualBalances([]);
      setSelectedAccount('');
      setBalance('');
      setActiveTab('file');
    }
    // Llamar al onOpenChange del padre
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${modalSize} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Carga Inicial de Saldos</DialogTitle>
          <DialogDescription>
            Carga los saldos iniciales de las cuentas contables mediante archivo
            Excel o carga manual
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="file"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Archivo Excel</TabsTrigger>
            <TabsTrigger value="manual">Carga Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo Excel</Label>
              <div className="flex gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Plantilla
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las columnas: cuenta, descripcion,
                saldo
              </p>
            </div>

            {file && (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Archivo seleccionado:</p>
                <p className="text-sm text-muted-foreground">{file.name}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitFile}
                disabled={!file || bootstrappingFileMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {bootstrappingFileMutation.isPending
                  ? 'Cargando...'
                  : 'Cargar Archivo'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 mt-2">
                  <Label htmlFor="account">Cuenta</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger id="account" className="w-full mt-2">
                      <SelectValue placeholder="Seleccione una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountPlans.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id?.toString() ?? ''}
                        >
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3 mt-2">
                  <Label htmlFor="balance">Saldo</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBalance();
                      }
                    }}
                    className="mt-2"
                  />
                </div>

                <div className="col-span-2 flex items-end ">
                  <Button
                    type="button"
                    onClick={handleAddBalance}
                    disabled={!selectedAccount || !balance}
                    className="w-full mt-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {manualBalances.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>

                  {/* Contenedor con scroll para las filas */}
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {manualBalances.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.accountCode}
                            </TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.balance, 'VES')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBalance(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Fila de total fija */}
                  <Table>
                    <TableBody>
                      <TableRow className="font-bold bg-muted/50 border-t-2">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(getTotalBalance(), 'VES')}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {manualBalances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay cuentas agregadas. Seleccione una cuenta y agregue un
                  saldo.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitManual}
                disabled={
                  manualBalances.length === 0 || bootstrappingMutation.isPending
                }
              >
                {bootstrappingMutation.isPending
                  ? 'Cargando...'
                  : `Cargar ${manualBalances.length} Saldo${manualBalances.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
