/**
 * Interfaz pública para el servicio toast
 * Solo expone los métodos que deben ser públicos
 *
 *
 */

export interface ToastServiceInterface {
  setTheme(isDark: boolean): void;
  success(
    message: string | { title: string; description?: string },
    options?: any,
  ): void;
  error(
    message: string | { title: string; description?: string },
    options?: any,
  ): void;
  warning(
    message: string | { title: string; description?: string },
    options?: any,
  ): void;
  info(
    message: string | { title: string; description?: string },
    options?: any,
  ): void;
  loading(
    message: string | { title: string; description?: string },
    options?: any,
  ): void;
  promise<T>(promise: Promise<T>, options: any): void;
  dismiss(toastId?: string | number): void;
  dismissAll(): void;
  crud: {
    create: {
      success: (entity?: string) => void;
      error: (entity?: string) => void;
      loading: (entity?: string) => void;
    };
    update: {
      success: (entity?: string) => void;
      error: (entity?: string) => void;
      loading: (entity?: string) => void;
    };
    delete: {
      success: (entity?: string) => void;
      error: (entity?: string) => void;
      loading: (entity?: string) => void;
      confirm: (entity?: string) => void;
    };
  };
  network: {
    error: () => void;
    offline: () => void;
    timeout: () => void;
  };
  auth: {
    loginSuccess: () => void;
    loginError: () => void;
    logoutSuccess: () => void;
    sessionExpired: () => void;
  };
}
