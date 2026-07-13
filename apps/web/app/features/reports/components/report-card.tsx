import { type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/shadcn/card';

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function ReportCard({ title, description, icon: Icon, onClick }: ReportCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Haga clic para generar este reporte con los parámetros deseados.
        </p>
      </CardContent>
    </Card>
  );
}
