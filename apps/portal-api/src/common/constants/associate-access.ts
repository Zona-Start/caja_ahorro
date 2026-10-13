/**
 * Reglas de acceso al Portal del Asociado según el estatus del asociado
 * (`savings.associates.status`).
 *
 * Solo los asociados con estatus **ACTIVE** o **PENDING** pueden acceder.
 */
export const PORTAL_ALLOWED_ASSOCIATE_STATUSES = ['ACTIVE', 'PENDING'] as const;

export type PortalAllowedAssociateStatus =
  (typeof PORTAL_ALLOWED_ASSOCIATE_STATUSES)[number];

/** `true` si el asociado puede acceder al portal (status ACTIVE o PENDING). */
export function canAssociateAccessPortal(
  status: string | null | undefined,
): boolean {
  return (
    !!status &&
    (PORTAL_ALLOWED_ASSOCIATE_STATUSES as readonly string[]).includes(status)
  );
}
