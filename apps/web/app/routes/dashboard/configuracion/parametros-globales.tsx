import GlobalSettingsList from '@/features/core/settings/global/components/global-settings-list';
import { globalSettingsListLoader } from '@/features/core/settings/global/loaders/global-settings-loader';
import type { Route } from './+types/parametros-globales';

export function clientLoader({ request }: Route.LoaderArgs) {
  return globalSettingsListLoader({ request } as any);
}

export default function GlobalSettingsPage() {
  return <GlobalSettingsList />;
}
