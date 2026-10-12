/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    tenant: import('./lib/theme').TenantBrand | null;
  }
}
