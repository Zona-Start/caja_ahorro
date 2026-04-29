import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@repo/shadcn/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="text-lg">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg">{user.fullname}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg">{user.status ?? 'N/A'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Roles</p>
            <div className="flex flex-wrap gap-2">
              {user.memberships.map((membership, index) => (
                <Badge key={`${membership.role?.id ?? index}`} variant="secondary">
                  {membership.role?.name ?? 'Sin rol'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
