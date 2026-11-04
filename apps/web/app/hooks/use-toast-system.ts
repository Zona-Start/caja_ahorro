import { useToast } from '@repo/shadcn/hooks/use-toast';

type ToastInput =
  | string
  | {
      title: string;
      description?: string;
      duration?: number;
    };

function normalizeInput(input: ToastInput, fallbackTitle: string) {
  if (typeof input === 'string') {
    return {
      title: fallbackTitle,
      description: input,
      duration: undefined,
    };
  }

  return {
    title: input.title || fallbackTitle,
    description: input.description,
    duration: input.duration,
  };
}

export function useToastSystem() {
  const { toast } = useToast();

  const success = (input: ToastInput) => {
    const { title, description, duration } = normalizeInput(input, 'Éxito');
    toast({
      variant: 'success',
      title,
      description,
      duration,
    });
  };

  const error = (input: ToastInput) => {
    const { title, description, duration } = normalizeInput(input, 'Error');
    toast({
      variant: 'destructive',
      title,
      description,
      duration,
    });
  };

  const info = (input: ToastInput) => {
    const { title, description, duration } = normalizeInput(
      input,
      'Información',
    );
    toast({
      variant: 'info',
      title,
      description,
      duration,
    });
  };

  const warning = (input: ToastInput) => {
    const { title, description, duration } = normalizeInput(
      input,
      'Advertencia',
    );
    toast({
      variant: 'warning',
      title,
      description,
      duration,
    });
  };

  return { toast, success, error, info, warning };
}
