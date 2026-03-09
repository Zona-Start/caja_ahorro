import PageContainer from '@/components/layout/page-container';
import { LoadAssetsView } from '@/feactures/savings-banks/assets/individual-load/component/load-asset-view';

export const metadata = {
  title: 'Dashboard: Carga Haberes',
};

export default async function Page() {

  return (
    <PageContainer scrollable={false}>

    <div className="container mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carga de Haberes</h1>
            <p className="text-muted-foreground">Registre depósitos y haberes para los asociados</p>
          </div>
        </div>

        <LoadAssetsView />
      </div>
    </div>

    </PageContainer>
  );
}
