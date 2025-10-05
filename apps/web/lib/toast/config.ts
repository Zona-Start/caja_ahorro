import { ToastConfig } from './types';

/**
 * Configuración centralizada para el sistema de notificaciones toast
 * Define colores, duraciones y comportamientos por defecto
 */
export const toastConfig: ToastConfig = {
  defaults: {
    success: {
      duration: 4000,
      dismissible: true,
    },
    error: {
      duration: 6000,
      dismissible: true,
    },
    warning: {
      duration: 5000,
      dismissible: true,
    },
    info: {
      duration: 4000,
      dismissible: true,
    },
    loading: {
      duration: 0, // No auto-dismiss para loading
      dismissible: false,
    },
    promise: {
      dismissible: true,
    },
  },
  
  theme: {
    light: {
      success: {
        background: 'hsl(143, 85%, 96%)',
        foreground: 'hsl(140, 100%, 27%)',
        border: 'hsl(145, 92%, 91%)',
        icon: 'hsl(140, 100%, 27%)',
      },
      error: {
        background: 'hsl(0, 93%, 94%)',
        foreground: 'hsl(0, 84%, 37%)',
        border: 'hsl(0, 93%, 94%)',
        icon: 'hsl(0, 84%, 37%)',
      },
      warning: {
        background: 'hsl(48, 96%, 89%)',
        foreground: 'hsl(25, 95%, 53%)',
        border: 'hsl(48, 96%, 89%)',
        icon: 'hsl(25, 95%, 53%)',
      },
      info: {
        background: 'hsl(208, 100%, 97%)',
        foreground: 'hsl(210, 92%, 45%)',
        border: 'hsl(213, 97%, 87%)',
        icon: 'hsl(210, 92%, 45%)',
      },
      loading: {
        background: 'hsl(210, 40%, 98%)',
        foreground: 'hsl(215, 13%, 34%)',
        border: 'hsl(214, 32%, 91%)',
        icon: 'hsl(215, 13%, 34%)',
      },
    },
    
    dark: {
      success: {
        background: 'hsl(150, 100%, 6%)',
        foreground: 'hsl(150, 86%, 65%)',
        border: 'hsl(147, 100%, 12%)',
        icon: 'hsl(150, 86%, 65%)',
      },
      error: {
        background: 'hsl(358, 76%, 10%)',
        foreground: 'hsl(358, 100%, 81%)',
        border: 'hsl(357, 89%, 16%)',
        icon: 'hsl(358, 100%, 81%)',
      },
      warning: {
        background: 'hsl(64, 100%, 6%)',
        foreground: 'hsl(46, 87%, 65%)',
        border: 'hsl(60, 100%, 12%)',
        icon: 'hsl(46, 87%, 65%)',
      },
      info: {
        background: 'hsl(215, 100%, 6%)',
        foreground: 'hsl(216, 87%, 65%)',
        border: 'hsl(223, 100%, 12%)',
        icon: 'hsl(216, 87%, 65%)',
      },
      loading: {
        background: 'hsl(220, 13%, 9%)',
        foreground: 'hsl(220, 14%, 71%)',
        border: 'hsl(217, 32%, 17%)',
        icon: 'hsl(220, 14%, 71%)',
      },
    },
  },
};

/**
 * Mapeo de mensajes predeterminados por contexto
 */
export const defaultMessages = {
  // CRUD Operations
  create: {
    success: '¡Elemento creado exitosamente!',
    error: 'Error al crear el elemento',
    loading: 'Creando elemento...',
  },
  update: {
    success: '¡Elemento actualizado exitosamente!',
    error: 'Error al actualizar el elemento',
    loading: 'Actualizando elemento...',
  },
  delete: {
    success: '¡Elemento eliminado exitosamente!',
    error: 'Error al eliminar el elemento',
    loading: 'Eliminando elemento...',
    warning: '¿Estás seguro de eliminar este elemento?',
  },
  
  // Network Operations
  network: {
    error: 'Error de conexión. Verifica tu internet',
    offline: 'No hay conexión a internet',
    timeout: 'La operación tomó demasiado tiempo',
  },
  
  // Authentication
  auth: {
    loginSuccess: '¡Bienvenido de vuelta!',
    loginError: 'Credenciales incorrectas',
    logoutSuccess: '¡Sesión cerrada exitosamente!',
    sessionExpired: 'Tu sesión ha expirado',
  },
  
  // Validation
  validation: {
    required: 'Por favor completa todos los campos requeridos',
    invalid: 'Algunos campos contienen errores',
    success: 'Validación exitosa',
  },
  
  // File Operations
  file: {
    uploadSuccess: '¡Archivo subido exitosamente!',
    uploadError: 'Error al subir el archivo',
    uploadProgress: 'Subiendo archivo...',
    downloadSuccess: '¡Archivo descargado!',
    downloadError: 'Error al descargar el archivo',
  },
  
  // Payment Operations  
  payment: {
    success: '¡Pago procesado exitosamente!',
    error: 'Error al procesar el pago',
    pending: 'Procesando pago...',
    cancelled: 'Pago cancelado',
  },
} as const;