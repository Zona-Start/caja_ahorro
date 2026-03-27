'use client';

import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import { Input } from '@repo/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { LoanDisbursementBatchItem } from '../schemas/loan-disbursement/batch-api-response';
import { itemResultSchema } from '../schemas/loan-disbursement/batch.schema';

type ItemResult = z.infer<typeof itemResultSchema>;

interface ConfirmItemsTableProps {
  items: LoanDisbursementBatchItem[];
  onResultsChange: (results: ItemResult[]) => void;
  initialResults: ItemResult[];
  disabled: boolean;
}

export function ConfirmItemsTable({
  items,
  onResultsChange,
  initialResults,
  disabled,
}: ConfirmItemsTableProps) {
  const [results, setResults] = useState<ItemResult[]>(initialResults);

  useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);

  const handleSelectAll = (checked: boolean) => {
    const newResults = results.map((result) => ({
      ...result,
      status: checked ? 'PROCESSED' : ('REJECTED' as 'PROCESSED' | 'REJECTED'),
    }));
    setResults(newResults);
    onResultsChange(newResults);
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    const newResults = results.map((result) =>
      result.itemId === itemId
        ? {
            ...result,
            status: checked
              ? 'PROCESSED'
              : ('REJECTED' as 'PROCESSED' | 'REJECTED'),
          }
        : result,
    );
    setResults(newResults);
    onResultsChange(newResults);
  };

  const handleReasonChange = (itemId: number, reason: string) => {
    const newResults = results.map((result) =>
      result.itemId === itemId ? { ...result, reason } : result,
    );
    setResults(newResults);
    onResultsChange(newResults);
  };

  const isItemSelected = (itemId: number) => {
    const result = results.find((r) => r.itemId === itemId);
    return result?.status === 'PROCESSED';
  };

  const isAllSelected =
    items.length > 0 && results.every((r) => r.status === 'PROCESSED');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Items del Lote</h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => handleSelectAll(true)}
            disabled={disabled || items.length === 0 || isAllSelected}
          >
            Seleccionar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => handleSelectAll(false)}
            disabled={
              disabled ||
              items.length === 0 ||
              results.every((r) => r.status === 'REJECTED')
            }
          >
            Deseleccionar Todos
          </Button>
        </div>
      </div>
      <div className="rounded-md border max-h-64 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                  disabled={disabled || items.length === 0}
                />
              </TableHead>
              <TableHead>Beneficiario</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Razón de Rechazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay ítems en este lote.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={isItemSelected(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item.id, checked as boolean)
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>{item.beneficiaryName}</TableCell>
                  <TableCell>{Number(item.amount).toFixed(2)} Bs.</TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Motivo del rechazo"
                      disabled={disabled || isItemSelected(item.id)}
                      onChange={(e) =>
                        handleReasonChange(item.id, e.target.value)
                      }
                      value={
                        results.find((r) => r.itemId === item.id)?.reason || ''
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
