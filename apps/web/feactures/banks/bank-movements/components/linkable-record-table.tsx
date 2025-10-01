'use client';

import { useEffect, useState } from 'react';

interface LinkableRecordTableProps {
  category: string | undefined;
  onRecordSelect: (record: any) => void;
}

export function LinkableRecordTable({ category, onRecordSelect }: LinkableRecordTableProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setRecords([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      // In a real implementation, you would fetch data from the backend here
      // based on the category.
      console.log(`Fetching data for category: ${category}`);
      
      // Simulating a network request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Placeholder data
      let placeholderData: any[] = [];
      if (category === 'LOAN_DISBURSEMENT') {
        placeholderData = [
          { id: 1, type: 'Loan', description: 'Loan for John Doe - $5000', amount: 5000 },
          { id: 2, type: 'Loan', description: 'Loan for Jane Smith - $10000', amount: 10000 },
        ];
      } else if (category === 'LOAN_PAYMENT') {
        placeholderData = [
          { id: 101, type: 'Installment', description: 'Installment #3 for loan #123', amount: 250 },
          { id: 102, type: 'Installment', description: 'Installment #4 for loan #456', amount: 500 },
        ];
      }

      setRecords(placeholderData);
      setIsLoading(false);
    };

    fetchData();
  }, [category]);

  if (!category) {
    return <div className="p-4 border rounded-md bg-muted/50 text-sm text-muted-foreground">Seleccione una categoría para ver los registros disponibles.</div>;
  }

  if (isLoading) {
    return <div className="p-4 border rounded-md text-sm">Cargando registros...</div>;
  }

  if (records.length === 0) {
    return <div className="p-4 border rounded-md text-sm">No hay registros disponibles para vincular en esta categoría.</div>;
  }

  return (
    <div className="p-4 border rounded-md">
        <h4 className="font-semibold mb-2">Seleccione un registro para vincular</h4>
        <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left">
                        <th className="p-2">Descripción</th>
                        <th className="p-2 text-right">Monto</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record.id} className="border-t">
                            <td className="p-2">{record.description}</td>
                            <td className="p-2 text-right">{record.amount.toFixed(2)}</td>
                            <td className="p-2 text-right">
                                <Button size="sm" variant="outline" onClick={() => onRecordSelect(record)}>
                                    Seleccionar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
