'use client';

import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Toaster } from '@repo/shadcn/toaster';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LoanForm } from './loan-form';
import { LoanSearch } from './loan-search';
import { LoanSummary } from './loan-summary';

// Simulación de tipos de préstamos
const loanTypes = [
  { id: 'personal', name: 'Personal', maxTerm: 36, interestRate: 12.5 },
  { id: 'hipotecario', name: 'Hipotecario', maxTerm: 240, interestRate: 8.5 },
  { id: 'vehicular', name: 'Vehicular', maxTerm: 60, interestRate: 10.0 },
  { id: 'educativo', name: 'Educativo', maxTerm: 48, interestRate: 7.5 },
];

export function LoanView() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loanSummary, setLoanSummary] = useState<{
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
  } | null>(null);
  const [formValues, setFormValues] = useState({});
  const [selectedLoanType, setSelectedLoanType] = useState<{
    id: string;
    name: string;
    maxTerm: number;
    interestRate: number;
  } | null>(null);
  const [stickyTop, setStickyTop] = useState(4);

  // Referencias para los elementos DOM
  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Función para manejar la selección de asociado
  const handleSelectAssociate = (associate: any) => {
    setSelectedAssociate(associate);
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = useCallback((values: any) => {
    setFormValues(values);

    // Actualizar el tipo de préstamo seleccionado
    if (values.loanTypeId) {
      const loanType = loanTypes.find((lt) => lt.id === values.loanTypeId);
      setSelectedLoanType(loanType ?? null);
    } else {
      setSelectedLoanType(null);
    }

    // Calcular resumen del préstamo
    const amount = Number.parseFloat(values.requestedAmount || '0');
    const term = Number.parseInt(values.termMonths || '0');
    const rate = Number.parseFloat(values.interestRate || '0');
    const installments = Number.parseInt(values.installmentsCount || '0');
    const expenses = Number.parseFloat(values.expensesAmount || '0');

    if (amount > 0 && term > 0 && rate > 0 && installments > 0) {
      // Cálculo simple de interés (en la práctica se usaría una fórmula más compleja)
      const monthlyRate = rate / 100 / 12;
      const totalInterest = amount * monthlyRate * term;
      const totalPayable = amount + totalInterest + expenses;
      const installmentAmount = totalPayable / installments;

      setLoanSummary({
        totalInterest: totalInterest.toFixed(2),
        totalPayable: totalPayable.toFixed(2),
        installmentAmount: installmentAmount.toFixed(2),
      });
    } else {
      setLoanSummary(null);
    }
  }, []);

  // Función para manejar el envío del formulario
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Aquí iría la lógica para enviar los datos al servidor
      console.log('Datos a enviar:', data);

      // Simulamos un delay para la operación
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Préstamo creado con éxito',
        description: `Se ha registrado un préstamo de $${data.requestedAmount} para ${selectedAssociate?.name}.`,
      });

      // Resetear el estado
      setSelectedAssociate(null);
      setLoanSummary(null);
      setFormValues({});
      setSelectedLoanType(null);
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear préstamo',
        description:
          'Ocurrió un error al procesar la operación. Intente nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efecto para manejar el scroll y ajustar la posición del componente sticky
  useEffect(() => {
    const handleScroll = () => {
      if (!searchRef.current || !formRef.current) return;

      const searchRect = searchRef.current.getBoundingClientRect();
      const formRect = formRef.current.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      // Determinar la posición del sticky basado en la dirección del scroll
      if (scrollingDown) {
        // Cuando bajamos, alineamos con el formulario
        if (formRect.top <= 4) {
          setStickyTop(4);
        }
      } else {
        // Cuando subimos, alineamos con el search si está visible
        if (searchRect.bottom >= 4) {
          const newTop = Math.max(4, searchRect.top);
          setStickyTop(newTop);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Creación de Préstamo
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para crear un nuevo préstamo para un asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Contenedor para LoanSearch con ancho completo */}
          <div ref={searchRef} className="mb-6">
            <LoanSearch
              onSelectAssociate={handleSelectAssociate}
              selectedAssociate={selectedAssociate}
            />
          </div>

          {/* Formulario de préstamo */}
          <div ref={formRef}>
            <LoanForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              loanSummary={loanSummary}
              onFormChange={handleFormChange}
            />
          </div>
        </div>

        {/* Columna lateral con posición sticky */}
        <div className="relative lg:col-span-1">
          <div
            ref={summaryRef}
            className="sticky top-24  @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28"
            style={{ top: `${stickyTop}px` }}
          >
            <LoanSummary
              selectedAssociate={selectedAssociate}
              selectedLoanType={selectedLoanType}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
