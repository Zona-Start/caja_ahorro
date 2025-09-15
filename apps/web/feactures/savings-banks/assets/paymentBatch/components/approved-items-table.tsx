'use client';

import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface ApprovedItem {
  id: number;
  associateName: string;
  reference: string;
  amount: string;
  approvalDate: string;
}

interface ApprovedItemsTableProps {
  title: string;
  items: ApprovedItem[];
  itemType: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION';
  onSelectionChange: (
    selectedItems: { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: number }[],
  ) => void;
  selectedItems: { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: number }[];
}

export function ApprovedItemsTable({
  title,
  items,
  itemType,
  onSelectionChange,
  selectedItems,
}: ApprovedItemsTableProps) {
  const [localSelectedItems, setLocalSelectedItems] = useState<
    { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: number }[]
  >(selectedItems.filter(item => item.type === itemType));

  useEffect(() => {
    setLocalSelectedItems(selectedItems.filter(item => item.type === itemType));
  }, [selectedItems, itemType]);

  const handleSelectAll = (checked: boolean) => {
    let newSelectedItems = [...selectedItems];
    const currentTypeItems = items.map((item) => ({
      type: itemType,
      sourceId: item.id,
    }));

    if (checked) {
      // Add all items of this type that are not already selected
      currentTypeItems.forEach(newItem => {
        if (!newSelectedItems.some(existingItem => existingItem.type === newItem.type && existingItem.sourceId === newItem.sourceId)) {
          newSelectedItems.push(newItem);
        }
      });
    } else {
      // Remove all items of this type
      newSelectedItems = newSelectedItems.filter(item => item.type !== itemType);
    }
    onSelectionChange(newSelectedItems);
  };

  const handleSelectItem = (item: ApprovedItem, checked: boolean) => {
    let newSelectedItems = [...selectedItems];
    const newItem = { type: itemType, sourceId: item.id };

    if (checked) {
      newSelectedItems.push(newItem);
    } else {
      newSelectedItems = newSelectedItems.filter(
        (selected) =>
          !(selected.type === newItem.type && selected.sourceId === newItem.sourceId),
      );
    }
    onSelectionChange(newSelectedItems);
  };

  const isItemSelected = (itemId: number) => {
    return localSelectedItems.some(
      (selected) => selected.sourceId === itemId && selected.type === itemType,
    );
  };

  const isAllSelected =
    items.length > 0 &&
    items.every((item) => isItemSelected(item.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(true)}
            disabled={items.length === 0 || isAllSelected}
          >
            Seleccionar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(false)}
            disabled={localSelectedItems.length === 0}
          >
            Deseleccionar Todos
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  disabled={items.length === 0}
                />
              </TableHead>
              <TableHead>Asociado</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha Aprobación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay {title.toLowerCase()} aprobados disponibles.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={isItemSelected(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{item.associateName}</TableCell>
                  <TableCell>{item.reference}</TableCell>
                  <TableCell>{itemType}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>
                    {format(new Date(item.approvalDate), 'dd/MM/yyyy')}
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
