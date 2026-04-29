'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Trash2 } from 'lucide-react';
import { useLinkableStore } from '../store/use-linkable-store';

export function SelectedLinkableItemsTable() {
  const { selectedItems, removeItem, totalAmount } = useLinkableStore();

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Operaciones Seleccionadas</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedItems.map((item) => (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell>{item.concept}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(item.amount), 'VES')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id, item.type)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatCurrency(totalAmount, 'VES')}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
