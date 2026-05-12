import { useToast } from '@repo/shadcn/hooks/use-toast';

type ToastInput = string | { title: string; description: string };

export function useToastSystem() {
  const { toast } = useToast();

  const success = (input: ToastInput) => {
    if (typeof input === 'string') {
      toast({ title: 'Exito', description: input });
    } else {
      toast({ title: input.title, description: input.description });
    }
  };

  const error = (input: ToastInput) => {
    if (typeof input === 'string') {
      toast({ variant: 'destructive', title: 'Error', description: input });
    } else {
      toast({ variant: 'destructive', title: input.title, description: input.description });
    }
  };

  const info = (input: ToastInput) => {
    if (typeof input === 'string') {
      toast({ title: 'Informacion', description: input });
    } else {
      toast({ title: input.title, description: input.description });
    }
  };

  const warning = (input: ToastInput) => {
    if (typeof input === 'string') {
      toast({ variant: 'destructive', title: 'Advertencia', description: input });
    } else {
      toast({ variant: 'destructive', title: input.title, description: input.description });
    }
  };

  return { toast, success, error, info, warning };
}
