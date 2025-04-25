import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { BarChart4, CreditCard, Wallet } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard: Ärea de Prestamos',
};

export default async function Page() {
  const modules = [
    {
      title: 'Gestion Préstamos',
      description: 'Crear y gestionar préstamos para asociados',
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      href: '/dashboard/prestamos/ordinarios',
    },
    {
      title: 'Refinanciamiento',
      description: 'Crear y gestiona retiros refinanciamientos de prestamos',
      icon: <Wallet className="h-8 w-8 text-primary" />,
      href: '/dashboard/prestamos/ordinarios',
    },
    {
      title: 'Reintegros',
      description: 'Crear y gestiona reintegros de fondos',
      icon: <BarChart4 className="h-8 w-8 text-primary" />,
      href: '/dashboard/prestamos/ordinarios',
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Área de Prestamos
          </h1>
          <p className="text-muted-foreground">
            Seleccione un módulo para comenzar a trabajar
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link href={module.href} key={module.title}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {module.title}
                  </CardTitle>
                  {module.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      )
    </PageContainer>
  );
}
