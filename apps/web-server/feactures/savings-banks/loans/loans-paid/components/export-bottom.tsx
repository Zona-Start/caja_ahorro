"use client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Download, FileText, Loader2, Sheet } from 'lucide-react';
import { useExportLoanPaid } from '../hooks/use-loans-paid-mutation';
import { Button } from '@repo/shadcn/components/ui/button';

export function ExportLoanPaidButton({ currentFilters }: { currentFilters: any }) {
  const { mutate: exportPdf, isPending } = useExportLoanPaid();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Opciones de PDF</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportPdf(currentFilters)}>
          <FileText className="mr-2 h-4 w-4" /> Exportar Vista Actual
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPdf(null)}>
          <FileText className="mr-2 h-4 w-4" /> Exportar Todo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Opciones de Excel</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <Sheet className="mr-2 h-4 w-4" /> Excel (Próximamente)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
