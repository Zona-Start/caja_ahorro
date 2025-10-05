import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import toast from '@/lib/toast';
import type { ToastServiceInterface } from '@/lib/toast';

/**
 * Hook personalizado que integra el sistema toast con el tema de la aplicación
 * Automáticamente configura el toast para usar los colores correctos según el tema actual
 */
export function useToastSystem(): ToastServiceInterface {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    // Configura el tema del toast basado en el tema actual
    const isDark = resolvedTheme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
    toast.setTheme(isDark);
  }, [theme, resolvedTheme]);

  return toast;
}

// Export adicional para uso directo sin el hook
export { toast };
export type { ToastServiceInterface };