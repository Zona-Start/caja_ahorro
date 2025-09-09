'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';

import { PurchaseOrderItemSchemaAPI } from '../schemas';

interface ItemListProps {
  items: PurchaseOrderItemSchemaAPI[];
}

export function PurchaseOrderItemList({ items }: ItemListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Costo Unitario</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.itemName}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.unitCost.toFixed(2)}</TableCell>
            <TableCell>{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
