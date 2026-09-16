import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Heading } from '@repo/shadcn/heading';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Separator } from '@repo/shadcn/separator';
import { Calculator, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  useActiveSession,
  useCashRegistersAll,
  useCloseSessionMutation,
  useOpenSessionMutation,
} from '../../../expenses/hooks/use-cash-register-queries';

const fmt = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CloseCashPage() {
  const { data: registersData } = useCashRegistersAll();
  const [registerId, setRegisterId] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [physicalCount, setPhysicalCount] = useState('');

  const { data: activeSessionData, isLoading: sessionLoading } =
    useActiveSession(registerId, !!registerId);
  const openSession = useOpenSessionMutation();
  const closeSession = useCloseSessionMutation();

  const registers = (registersData?.data ?? []).filter((r) => r.isActive);
  const session = activeSessionData?.data?.session;

  useEffect(() => {
    const first = registers[0];
    if (!registerId && first) {
      setRegisterId(first.id);
    }
  }, [registerId, registers]);

  const expected = session ? Number(session.systemExpectedBalance ?? 0) : 0;
  const counted = Number(physicalCount) || 0;
  const difference = Number((counted - expected).toFixed(2));
  const isSquare = difference === 0;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading
        title="Cierre de Caja"
        description="Arqueo diario: compara el efectivo esperado contra el contado."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Caja POS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={registerId} onValueChange={setRegisterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una caja" />
              </SelectTrigger>
              <SelectContent>
                {registers.map((register) => (
                  <SelectItem key={register.id} value={register.id}>
                    {register.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!session && registerId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fondo inicial (apertura)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={initialBalance}
                  onChange={(event) => setInitialBalance(event.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={openSession.isPending}
                  onClick={() =>
                    openSession.mutate({
                      cashRegisterId: registerId,
                      initialBalance: Number(initialBalance) || 0,
                    })
                  }
                >
                  {openSession.isPending ? 'Abriendo...' : 'Abrir sesión'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Calculator className="h-5 w-5" />
            <CardTitle className="text-base">Arqueo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionLoading && (
              <p className="text-muted-foreground text-sm">Consultando...</p>
            )}

            {!session && !sessionLoading && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
                No hay una sesión abierta para esta caja. Abre una sesión para
                realizar el arqueo.
              </div>
            )}

            {session && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Saldo esperado (sistema)
                    </span>
                    <span className="font-mono font-semibold">
                      Bs. {fmt(expected)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Conteo físico de efectivo
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={physicalCount}
                      onChange={(event) =>
                        setPhysicalCount(event.target.value)
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <Separator />

                <div
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    isSquare
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSquare ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="text-destructive h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">
                      {isSquare
                        ? 'Caja cuadrada'
                        : difference > 0
                          ? 'Sobrante en caja'
                          : 'Faltante en caja'}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-lg font-bold ${
                      isSquare ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {difference > 0 ? '+' : ''}
                    {fmt(difference)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    !physicalCount ||
                    counted < 0 ||
                    closeSession.isPending
                  }
                  onClick={() =>
                    closeSession.mutate(
                      {
                        id: session.id,
                        actualPhysicalBalance: counted,
                      },
                      { onSuccess: () => setPhysicalCount('') },
                    )
                  }
                >
                  {closeSession.isPending ? 'Cerrando...' : 'Cerrar caja (Corte Z)'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
