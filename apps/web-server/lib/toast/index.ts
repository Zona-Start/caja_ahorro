/**
 * Sistema Toast Centralizado
 * 
 * Proporciona una interfaz unificada para notificaciones con:
 * - Colores consistentes para modo claro/oscuro
 * - Mensajes predeterminados por contexto
 * - Tipografía mejorada
 * - Métodos de conveniencia para CRUD
 * - Gestión centralizada de configuración
 * 
 * @example
 * ```typescript
 * import { toast } from '@/lib/toast';
 * 
 * // Uso básico
 * toast.success('¡Operación exitosa!');
 * toast.error('Algo salió mal');
 * toast.warning('Cuidado con esta acción');
 * 
 * // Con título y descripción
 * toast.success({
 *   title: '¡Cuenta creada!',
 *   description: 'Se ha enviado un email de confirmación'
 * });
 * 
 * // Métodos de conveniencia CRUD
 * toast.crud.create.success('Proveedor');
 * toast.crud.update.error('cuenta contable');
 * toast.crud.delete.confirm('asiento contable');
 * 
 * // Para promesas
 * toast.promise(createUser(), {
 *   loading: 'Creando usuario...',
 *   success: '¡Usuario creado!',
 *   error: 'Error al crear usuario'
 * });
 * ```
 */

export { toastService, default as toast } from './toast-service';
export type { ToastServiceInterface } from './interface';
export * from './types';
export * from './config';

// Export por defecto
export { default } from './toast-service';