import { toast as sonnerToast } from 'sonner';
import type { ToastType, ToastOptions, PromiseToastOptions } from './types';
import { toastConfig, defaultMessages } from './config';
import type { ToastServiceInterface } from './interface';

/**
 * Servicio centralizado de notificaciones toast
 * 
 * Proporciona una interfaz unificada para mostrar notificaciones
 * con colores consistentes, mensajes predeterminados y mejor UX
 */
class ToastService implements ToastServiceInterface {
  private isDark = false;

  /**
   * Configura el tema del toast (claro/oscuro)
   */
  setTheme(isDark: boolean) {
    this.isDark = isDark;
  }

  /**
   * Obtiene la configuración de estilo para un tipo de toast
   */
  private getToastStyle(type: ToastType) {
    const theme = this.isDark ? toastConfig.theme.dark : toastConfig.theme.light;
    const colors = theme[type as keyof typeof theme];
    
    return {
      style: {
        background: colors.background,
        color: colors.foreground,
        border: `1px solid ${colors.border}`,
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: this.isDark 
          ? '0 10px 38px -10px rgba(0, 0, 0, 0.35), 0 10px 20px -15px rgba(0, 0, 0, 0.2)'
          : '0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)',
      },
    };
  }

  /**
   * Normaliza el mensaje (puede ser string u objeto con title/description)
   */
  private normalizeMessage(message: string | { title: string; description?: string }) {
    if (typeof message === 'string') {
      return { title: message };
    }
    return message;
  }

  /**
   * Aplica configuración por defecto para un tipo de toast
   */
  private applyDefaults(type: ToastType, options?: ToastOptions): ToastOptions {
    const defaults = toastConfig.defaults[type];
    return { ...defaults, ...options };
  }

  /**
   * Muestra una notificación de éxito
   */
  success(
    message: string | { title: string; description?: string },
    options?: ToastOptions
  ) {
    const normalized = this.normalizeMessage(message);
    const config = this.applyDefaults('success', options);
    const style = this.getToastStyle('success');

    return sonnerToast.success(normalized.title, {
      description: normalized.description || config.description,
      duration: config.duration,
      id: config.id,
      dismissible: config.dismissible,
      action: config.action,
      ...style,
    });
  }

  /**
   * Muestra una notificación de error
   */
  error(
    message: string | { title: string; description?: string },
    options?: ToastOptions
  ) {
    const normalized = this.normalizeMessage(message);
    const config = this.applyDefaults('error', options);
    const style = this.getToastStyle('error');

    return sonnerToast.error(normalized.title, {
      description: normalized.description || config.description,
      duration: config.duration,
      id: config.id,
      dismissible: config.dismissible,
      action: config.action,
      ...style,
    });
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(
    message: string | { title: string; description?: string },
    options?: ToastOptions
  ) {
    const normalized = this.normalizeMessage(message);
    const config = this.applyDefaults('warning', options);
    const style = this.getToastStyle('warning');

    return sonnerToast.warning(normalized.title, {
      description: normalized.description || config.description,
      duration: config.duration,
      id: config.id,
      dismissible: config.dismissible,
      action: config.action,
      ...style,
    });
  }

  /**
   * Muestra una notificación informativa
   */
  info(
    message: string | { title: string; description?: string },
    options?: ToastOptions
  ) {
    const normalized = this.normalizeMessage(message);
    const config = this.applyDefaults('info', options);
    const style = this.getToastStyle('info');

    return sonnerToast.info(normalized.title, {
      description: normalized.description || config.description,
      duration: config.duration,
      id: config.id,
      dismissible: config.dismissible,
      action: config.action,
      ...style,
    });
  }

  /**
   * Muestra una notificación de carga
   */
  loading(
    message: string | { title: string; description?: string },
    options?: ToastOptions
  ) {
    const normalized = this.normalizeMessage(message);
    const config = this.applyDefaults('loading', options);
    const style = this.getToastStyle('loading');

    return sonnerToast.loading(normalized.title, {
      description: normalized.description || config.description,
      duration: config.duration,
      id: config.id,
      dismissible: config.dismissible,
      ...style,
    });
  }

  /**
   * Maneja promesas con estados loading/success/error automáticos
   */
  promise<T>(
    promise: Promise<T>,
    options: PromiseToastOptions<T>
  ) {
    const loadingMsg = this.normalizeMessage(options.loading);
    const style = this.getToastStyle('loading');

    return sonnerToast.promise(promise, {
      loading: loadingMsg.title,
      success: (data: T) => {
        if (typeof options.success === 'function') {
          const result = options.success(data);
          return this.normalizeMessage(result).title;
        }
        return this.normalizeMessage(options.success).title;
      },
      error: (error: Error) => {
        if (typeof options.error === 'function') {
          const result = options.error(error);
          return this.normalizeMessage(result).title;
        }
        return this.normalizeMessage(options.error).title;
      },
      ...style,
    });
  }

  /**
   * Cierra un toast específico por ID
   */
  dismiss(toastId?: string | number) {
    return sonnerToast.dismiss(toastId);
  }

  /**
   * Cierra todos los toasts
   */
  dismissAll() {
    return sonnerToast.dismiss();
  }

  // ===============================================
  // MÉTODOS DE CONVENIENCIA PARA OPERACIONES CRUD
  // ===============================================

  /**
   * Notificaciones específicas para operaciones CRUD
   */
  crud = {
    create: {
      success: (entity = 'Elemento') => 
        this.success(`¡${entity} creado exitosamente!`),
      error: (entity = 'elemento') => 
        this.error(`Error al crear ${entity.toLowerCase()}`),
      loading: (entity = 'elemento') => 
        this.loading(`Creando ${entity.toLowerCase()}...`),
    },
    
    update: {
      success: (entity = 'Elemento') => 
        this.success(`¡${entity} actualizado exitosamente!`),
      error: (entity = 'elemento') => 
        this.error(`Error al actualizar ${entity.toLowerCase()}`),
      loading: (entity = 'elemento') => 
        this.loading(`Actualizando ${entity.toLowerCase()}...`),
    },
    
    delete: {
      success: (entity = 'Elemento') => 
        this.success(`¡${entity} eliminado exitosamente!`),
      error: (entity = 'elemento') => 
        this.error(`Error al eliminar ${entity.toLowerCase()}`),
      loading: (entity = 'elemento') => 
        this.loading(`Eliminando ${entity.toLowerCase()}...`),
      confirm: (entity = 'elemento') => 
        this.warning(`¿Estás seguro de eliminar este ${entity.toLowerCase()}?`),
    },
  };

  /**
   * Notificaciones para operaciones de red
   */
  network = {
    error: () => this.error(defaultMessages.network.error),
    offline: () => this.warning(defaultMessages.network.offline),
    timeout: () => this.error(defaultMessages.network.timeout),
  };

  /**
   * Notificaciones de autenticación
   */
  auth = {
    loginSuccess: () => this.success(defaultMessages.auth.loginSuccess),
    loginError: () => this.error(defaultMessages.auth.loginError),
    logoutSuccess: () => this.success(defaultMessages.auth.logoutSuccess),
    sessionExpired: () => this.warning(defaultMessages.auth.sessionExpired),
  };
}

// Instancia singleton del servicio
const toastService = new ToastService();

// Export nombrado para uso directo
export { toastService };

// Export por defecto para uso directo
export default toastService;