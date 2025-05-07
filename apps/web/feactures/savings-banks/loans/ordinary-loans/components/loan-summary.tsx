'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { Alert, AlertDescription, AlertTitle } from '@repo/shadcn/alert';
import { Badge } from '@repo/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';
import { AlertCircle, CreditCard } from 'lucide-react';

interface LoanSummaryProps {
  selectedAssociate: any | null;
  selectedLoanType: any | null;
}

export function LoanSummary({
  selectedAssociate,
  selectedLoanType,
}: LoanSummaryProps) {
  if (!selectedAssociate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cuenta</CardTitle>
            <CardDescription>
              Seleccione un asociado para ver su información financiera
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center text-center">
            <div className="space-y-2">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                La información del asociado se mostrará aquí
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <IconWrapper color="indigo" className="w-6 h-6">
                <CreditCard className="h-4 w-4" />
              </IconWrapper>
              Información del Tipo de Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de préstamo se mostrará aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Estado de Cuenta</CardTitle>
            <Badge
              variant={
                selectedAssociate.blocks.length > 0 ? 'destructive' : 'outline'
              }
            >
              {selectedAssociate.blocks.length > 0
                ? 'Con Bloqueos'
                : 'Sin Bloqueos'}
            </Badge>
          </div>
          <CardDescription>
            Información financiera de {selectedAssociate.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ahorros</span>
              <span className="font-medium">
                ${selectedAssociate.savings.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Haberes</span>
              <span className="font-medium">
                ${selectedAssociate.assets.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">80% de Haberes</span>
              <span className="font-medium">
                ${(selectedAssociate.assets * 0.8).toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Disponibilidad</span>
              <span className="text-lg font-bold text-green-600">
                ${selectedAssociate.availability.toFixed(2)}
              </span>
            </div>

            {selectedAssociate.blocks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-medium">Bloqueos</h4>
                  {selectedAssociate.blocks.map((block: any, index: number) => (
                    <Alert key={index} variant="destructive" className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm">
                        {block.reason}
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        Monto: ${block.amount.toFixed(2)}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 rounded-md bg-muted p-3">
              <h4 className="mb-1 text-sm font-medium">
                Capacidad de Préstamo
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Máximo Recomendado</span>
                <span className="font-medium">
                  ${(selectedAssociate.availability * 0.9).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconWrapper color="indigo" className="w-6 h-6">
              <CreditCard className="h-4 w-4" />
            </IconWrapper>
            Información del Tipo de Préstamo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLoanType ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tipo</span>
                <span className="font-medium">{selectedLoanType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasa de Interés</span>
                <span className="font-medium">
                  {selectedLoanType.interestRate}% anual
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plazo Máximo</span>
                <span className="font-medium">
                  {selectedLoanType.maxTerm} meses
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de préstamo se mostrará aquí
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
