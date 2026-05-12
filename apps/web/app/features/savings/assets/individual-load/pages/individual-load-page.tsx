import { LoadAssetsView } from '../components/load-asset-view';

export function IndividualLoadPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carga de Haberes</h1>
        <p className="text-muted-foreground">
          Registre haberes individuales o masivos a los asociados
        </p>
      </div>
      <LoadAssetsView />
    </div>
  );
}

export default IndividualLoadPage;
