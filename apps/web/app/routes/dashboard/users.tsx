import { requirePermission } from '@/lib/auth-guards';
import { apiClient } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import type { User } from '@/lib/schemas';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGate } from '@/components/shared/permission-gate';
import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Button } from '@repo/shadcn/button';

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data as User[];
    },
  });

/**
 * Route guard: user must have iam:users read permission.
 * Note the `await` — this is critical, otherwise the guard doesn't block.
 */
export async function clientLoader() {
  await requirePermission('iam:users', 'read');
  await queryClient.ensureQueryData(usersQueryOptions());
  return null;
}

export default function UsersPage() {
  const { can } = usePermissions();
  const { data: users, isLoading } = useQuery(usersQueryOptions());

  if (!can('iam:users', 'read')) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No tiene permisos para ver usuarios.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Administración de usuarios del sistema
          </p>
        </div>

        {/* Button only visible if user can create users */}
        <PermissionGate resource="iam:users" action="create">
          <Button>Nuevo Usuario</Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Todos los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{user.fullname}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>

                    {/* Edit button only if user has update permission */}
                    <PermissionGate resource="iam:users" action="update">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </PermissionGate>

                    {/* Delete button only with delete + tenant scope */}
                    <PermissionGate
                      resource="iam:users"
                      action="delete"
                      scope="tenant"
                    >
                      <Button variant="ghost" size="sm" className="text-destructive">
                        Eliminar
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
