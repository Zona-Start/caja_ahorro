-- ============================================================================
-- 1. TRATAMIENTO PARA: supplier_invoices / invoice_suppliers_status
-- ============================================================================

-- Eliminar el valor por defecto que causa el bloqueo de dependencia
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint

-- Cambiar temporalmente el tipo de la columna a texto plano
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint

-- Ahora PostgreSQL permite borrar el ENUM viejo sin restricciones
DROP TYPE "purchasing"."invoice_suppliers_status";--> statement-breakpoint

-- Crear el nuevo ENUM con los valores actualizados
CREATE TYPE "purchasing"."invoice_suppliers_status" AS ENUM('DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');--> statement-breakpoint

-- Convertir la columna de texto de vuelta al nuevo tipo ENUM
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "status" SET DATA TYPE "purchasing"."invoice_suppliers_status" USING "status"::"purchasing"."invoice_suppliers_status";--> statement-breakpoint

-- Volver a colocar el valor por defecto deseado (ajusta 'DRAFT' si usas otro)
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint


-- ============================================================================
-- 2. TRATAMIENTO PARA: accounts_payable / payment_accounts_payable
-- ============================================================================

-- Eliminar preventivamente el valor por defecto por si existe
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint

-- Cambiar temporalmente el tipo de la columna a texto plano
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint

-- Borrar el ENUM viejo
DROP TYPE "purchasing"."payment_accounts_payable";--> statement-breakpoint

-- Crear el nuevo ENUM con los valores actualizados
CREATE TYPE "purchasing"."payment_accounts_payable" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');--> statement-breakpoint

-- Convertir la columna de texto de vuelta al nuevo tipo ENUM
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "status" SET DATA TYPE "purchasing"."payment_accounts_payable" USING "status"::"purchasing"."payment_accounts_payable";--> statement-breakpoint

-- Volver a colocar el valor por defecto deseado (ajusta 'PENDING' si usas otro)
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "status" SET DEFAULT 'PENDING';
