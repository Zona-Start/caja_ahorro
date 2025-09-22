'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Hash,
  Landmark,
  Receipt,
  User,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { bankAccountApiSchema } from '../schemas/bank-account-response-api';
import { BankAccount } from '../schemas/bank-account.schema';

type BankAccountApiData = z.infer<typeof bankAccountApiSchema>;
type BankAccountData = BankAccountApiData | BankAccount;

interface BankAccountDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccountData | null;
}

export function BankAccountDetailsModal({
  open,
  onOpenChange,
  bankAccount,
}: BankAccountDetailsModalProps) {
  if (!bankAccount) return null;

  type BadgeVariant =
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning';

  const getStatusBadge = (
    isActive: boolean,
  ): {
    variant: BadgeVariant;
    label: string;
  } => {
    return isActive
      ? { variant: 'success', label: 'Activa' }
      : { variant: 'destructive', label: 'Inactiva' };
  };
  const getCurrencyInfo = (currencyCode: string) => {
    switch (currencyCode.toLowerCase()) {
      case 'ves':
      case 'bs':
        return { symbol: 'Bs.', name: 'Bolívares' };
      case 'usd':
      case '$':
        return { symbol: 'USD', name: 'Dólares Estadounidenses' };
      case 'eur':
      case '€':
        return { symbol: 'EUR', name: 'Euros' };
      default:
        return { symbol: currencyCode, name: currencyCode };
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'No disponible';

    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const statusInfo = getStatusBadge(bankAccount.isActive);
  const currencyInfo = getCurrencyInfo(bankAccount.currencyCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Detalles de la Cuenta Bancaria
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Información completa de la cuenta bancaria seleccionada
          </DialogDescription>
          <Separator />
        </DialogHeader>

        <div className="space-y-4">
          {/* Información General */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <CreditCard className="h-4 w-4" />
                    Número de Cuenta
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                    {bankAccount.accountNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Building2 className="h-4 w-4" />
                    Tipo de Cuenta
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {bankAccount.accountType === 'CURRENT'
                      ? 'Corriente'
                      : 'Ahorro'}
                  </Badge>
                </div>
              </div>

              {bankAccount.accountName && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    Nombre de la Cuenta
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded">
                    {bankAccount.accountName}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {'bankDirectoryName' in bankAccount &&
                  bankAccount.bankDirectoryName && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <Landmark className="h-4 w-4" />
                        Banco
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                        {bankAccount.bankDirectoryName}
                      </p>
                    </div>
                  )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Hash className="h-4 w-4" />
                    Estado de la Cuenta
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  Moneda
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {currencyInfo.symbol}
                  </Badge>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currencyInfo.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    Saldo Actual
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                    {formatCurrency(Number(bankAccount.currentBalance), 'VES')}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Receipt className="h-4 w-4" />
                    Saldo Último Estado
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-neutral-800 px-3 py-2 rounded">
                    {formatCurrency(
                      Number(bankAccount.lastStatementBalance),
                      'VES',
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    Fecha de Apertura
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                    {formatDate(bankAccount.openingDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    Fecha Último Estado
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                    {formatDate(bankAccount.lastStatementDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
