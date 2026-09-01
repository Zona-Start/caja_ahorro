import { formatCurrency } from '@/lib/format-utils';
import { useAssociatesQuery } from '@/features/savings/partners/associates/hooks/use-associates-query';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
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
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-accounting-accounts-query';
import {
  useBootstrappingMutation,
  useBootstrappingWithFileMutation,
} from '../hooks/use-accounting-balances-mutation';

interface BootstrappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BalanceItem {
  accountCode: string;
  descripcion: string;
  auxiliarSocio?: string | null;
  auxiliarProveedor?: string | null;
  debe: number;
  haber: number;
}

export function BootstrappingModal({
  open,
  onOpenChange,
}: BootstrappingModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [manualBalances, setManualBalances] = useState<BalanceItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSocio, setIsSocio] = useState(false);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>('');
  const [isProveedor, setIsProveedor] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [movementType, setMovementType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [balance, setBalance] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('file');
  const [showConfirm, setShowConfirm] = useState(false);

  const bootstrappingMutation = useBootstrappingMutation();
  const bootstrappingFileMutation = useBootstrappingWithFileMutation();

  const { data: accountingAccounts } = useAccountingAccounts();
  const accountPlans = accountingAccounts || [];

  const { data: associatesData } = useAssociatesQuery({ page: 1, limit: 1000 });
  const associates = associatesData?.data || [];

  const { data: suppliersData } = useSuppliersAllQuery();
  const suppliers = suppliersData || [];

  const modalSize =
    activeTab === 'manual' ? 'sm:max-w-[1000px]' : 'sm:max-w-[500px]';

  const resetForm = () => {
    setSelectedAccount('');
    setDescription('');
    setIsSocio(false);
    setSelectedAssociateId('');
    setIsProveedor(false);
    setSelectedSupplierId('');
    setMovementType('DEBIT');
    setBalance('');
  };

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
    } catch (_) {
      // error handled by mutation onError toast
    }
  };

  const handleConfirmFile = () => {
    setShowConfirm(false);
    handleSubmitFile();
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    const account = accountPlans.find(
      (acc) => acc.id?.toString() === value,
    );
    if (account) {
      setDescription(account.name);
    }
  };

  const handleAddBalance = () => {
    if (!selectedAccount || !balance) return;

    const account = accountPlans.find(
      (acc) => acc.id?.toString() === selectedAccount,
    );
    if (!account) return;

    let auxiliarSocio: string | null = null;
    let auxiliarProveedor: string | null = null;

    if (isSocio && selectedAssociateId) {
      const assoc = associates.find(
        (a) => a.id === selectedAssociateId,
      );
      if (assoc) auxiliarSocio = assoc.cedula;
    }

    if (isProveedor && selectedSupplierId) {
      const sup = suppliers.find(
        (s) => s.id === selectedSupplierId,
      );
      if (sup) auxiliarProveedor = sup.taxId;
    }

    const amount = parseFloat(balance);
    const newBalance: BalanceItem = {
      accountCode: account.code,
      descripcion: description || account.name,
      auxiliarSocio,
      auxiliarProveedor,
      debe: movementType === 'DEBIT' ? amount : 0,
      haber: movementType === 'CREDIT' ? amount : 0,
    };

    setManualBalances([...manualBalances, newBalance]);
    resetForm();
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
    } catch (_) {
      // error handled by mutation onError toast
    }
  };

  const handleConfirmManual = () => {
    setShowConfirm(false);
    handleSubmitManual();
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['cuenta', 'descripcion', 'auxiliar_socio', 'auxiliar_proveedor', 'debe', 'haber'],
      ['112.01.01.01.001', 'Bicentenario Cta.Cte.', '', '', 50000.0, 0.0],
      ['311.01.01.00.001', 'Aportes del Asociado', 'V-12345678', '', 0.0, 50000.0],
      ['211.01.01.00.001', 'Cuentas por Pagar Proveedores', '', 'J-12345678-9', 0.0, 0.0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Carga Inicial');
    XLSX.writeFile(wb, 'template_carga_inicial.xlsx');
  };

  const getTotalDebe = () => {
    return manualBalances.reduce((sum, item) => sum + item.debe, 0);
  };

  const getTotalHaber = () => {
    return manualBalances.reduce((sum, item) => sum + item.haber, 0);
  };

  const handleCancel = () => {
    setFile(null);
    setManualBalances([]);
    resetForm();
    setActiveTab('file');
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFile(null);
      setManualBalances([]);
      resetForm();
      setActiveTab('file');
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={`${modalSize} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Carga Inicial de Saldos</DialogTitle>
            <DialogDescription>
              Carga los saldos iniciales mediante archivo Excel o carga manual.
              Se generará un asiento contable de apertura (partida doble).
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
                  auxiliar_socio, auxiliar_proveedor, saldo
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
                  onClick={() => setShowConfirm(true)}
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
                  <div className="col-span-3 mt-2">
                    <Label>Cuenta</Label>
                    <Select
                      value={selectedAccount}
                      onValueChange={handleAccountChange}
                    >
                      <SelectTrigger className="w-full mt-2">
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
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción"
                      className="mt-2"
                    />
                  </div>

                  <div className="col-span-2 mt-2">
                    <Label>Debe / Haber</Label>
                    <Select
                      value={movementType}
                      onValueChange={(v) =>
                        setMovementType(v as 'DEBIT' | 'CREDIT')
                      }
                    >
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Debe / Haber" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEBIT">Debe</SelectItem>
                        <SelectItem value="CREDIT">Haber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 mt-2">
                    <Label htmlFor="balance">Saldo</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddBalance}
                      disabled={!selectedAccount || !balance}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isSocio"
                        checked={isSocio}
                        onCheckedChange={(checked) => {
                          setIsSocio(checked as boolean);
                          if (!checked) setSelectedAssociateId('');
                        }}
                      />
                      <Label htmlFor="isSocio">¿Auxiliar Socio?</Label>
                    </div>
                    {isSocio && (
                      <div className="mt-2">
                        <SelectSearchable
                          options={associates.map((a) => ({
                            value: a.id,
                            label: `${a.cedula} - ${a.fullname}`,
                          }))}
                          onValueChange={(value) =>
                            setSelectedAssociateId(value || '')
                          }
                          placeholder="Seleccione asociado"
                          value={selectedAssociateId}
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isProveedor"
                        checked={isProveedor}
                        onCheckedChange={(checked) => {
                          setIsProveedor(checked as boolean);
                          if (!checked) setSelectedSupplierId('');
                        }}
                      />
                      <Label htmlFor="isProveedor">¿Auxiliar Proveedor?</Label>
                    </div>
                    {isProveedor && (
                      <div className="mt-2">
                        <SelectSearchable
                          options={suppliers.map((s) => ({
                            value: s.id,
                            label: `${s.taxId} - ${s.name}`,
                          }))}
                          onValueChange={(value) =>
                            setSelectedSupplierId(value || '')
                          }
                          placeholder="Seleccione proveedor"
                          value={selectedSupplierId}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {manualBalances.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Auxiliar</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>

                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableBody>
                          {manualBalances.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {item.accountCode}
                              </TableCell>
                              <TableCell>{item.descripcion}</TableCell>
                              <TableCell>
                                {item.auxiliarSocio
                                  ? `Socio: ${item.auxiliarSocio}`
                                  : item.auxiliarProveedor
                                    ? `Prov: ${item.auxiliarProveedor}`
                                    : '—'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.debe > 0
                                  ? formatCurrency(item.debe, 'VES')
                                  : ''}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.haber > 0
                                  ? formatCurrency(item.haber, 'VES')
                                  : ''}
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

                    <Table>
                      <TableBody>
                        <TableRow className="font-bold bg-muted/50 border-t-2">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(getTotalDebe(), 'VES')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(getTotalHaber(), 'VES')}
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
                  onClick={() => setShowConfirm(true)}
                  disabled={
                    manualBalances.length === 0 ||
                    bootstrappingMutation.isPending
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

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar carga inicial</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea realizar la carga inicial de saldos?
              Se generará el asiento contable de apertura.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={
                activeTab === 'file' ? handleConfirmFile : handleConfirmManual
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
