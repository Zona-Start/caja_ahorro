'use client';

export function AccountingBalanceHeader() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Saldos Contables
          </h1>
          <p className="text-muted-foreground">
            Gestiona los saldos contables de tu empresa
          </p>
        </div>
      </div>
    </>
  );
}
