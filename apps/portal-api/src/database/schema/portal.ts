/**
 * Entry point SOLO para `drizzle-kit generate/migrate`.
 *
 * Re-exporta exclusivamente los objetos del esquema `portal` (tablas, enums y el
 * `portalSchema`) para que drizzle-kit genere únicamente el esquema del portal y no
 * toque las tablas del ERP (definidas en `./tables/erp.ts`, fuera de este entry).
 *
 * NO usar en runtime: el runtime usa `./index.ts`.
 */
export { portalSchema } from './_schemas';
export * from './enum/portal.enum';
export * from './tables/portal';
