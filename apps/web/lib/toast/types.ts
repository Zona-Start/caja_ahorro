/**
 * Tipos y configuraciones para el sistema de notificaciones toast centralizado
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise';

export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface ToastOptions {
  /** Duración en milisegundos. 0 = no auto-dismiss */
  duration?: number;
  /** Posición del toast */
  position?: ToastPosition;
  /** ID único para el toast */
  id?: string;
  /** Si se puede cerrar manualmente */
  dismissible?: boolean;
  /** Descripción adicional */
  description?: string;
  /** Acción personalizada */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Datos adicionales para tracking */
  metadata?: Record<string, unknown>;
}

export interface PromiseToastOptions<T> {
  loading: string | { title: string; description?: string };
  success: string | { title: string; description?: string } | ((data: T) => string | { title: string; description?: string });
  error: string | { title: string; description?: string } | ((error: Error) => string | { title: string; description?: string });
}

export interface ToastConfig {
  /** Configuración por defecto para cada tipo */
  defaults: {
    [K in ToastType]: Partial<ToastOptions>;
  };
  /** Configuración de colores para temas */
  theme: {
    light: ToastThemeColors;
    dark: ToastThemeColors;
  };
}

export interface ToastThemeColors {
  success: {
    background: string;
    foreground: string;
    border: string;
    icon: string;
  };
  error: {
    background: string;
    foreground: string;
    border: string;
    icon: string;
  };
  warning: {
    background: string;
    foreground: string;
    border: string;
    icon: string;
  };
  info: {
    background: string;
    foreground: string;
    border: string;
    icon: string;
  };
  loading: {
    background: string;
    foreground: string;
    border: string;
    icon: string;
  };
}