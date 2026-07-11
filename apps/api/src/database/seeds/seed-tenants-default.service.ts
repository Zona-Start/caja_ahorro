import * as schema from '@/database/schema';
import {
  accountPlan,
  categories,
  moduleSettings,
  rolePermissions,
  roles,
  tenantModules,
  tenantSettings,
} from '@/database/schema'; // Ajusta la ruta a tu schema
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '../drizzle-provider';

import { getTemplate } from './default-tenant/templates/index';
import type { AccountEntry } from './default-tenant/templates/template.types';

export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly businessType: string = 'CAJA_AHORRO',
    public readonly moduleCodes?: string[],
    public readonly systemUserId?: string,
  ) {}
}

@Injectable()
export class AccountPlanSeederService {
  private readonly logger = new Logger(AccountPlanSeederService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Este decorador hace que el servicio escuche automáticamente
   * cuando se dispara el evento 'tenant.created'
   */
  @OnEvent('tenant.created')
  async handleTenantCreated(payload: TenantCreatedEvent) {
    this.logger.log(
      `Iniciando seeding para Tenant: ${payload.tenantId} (businessType: ${payload.businessType})`,
    );
    try {
      const template = getTemplate(payload.businessType);
      const activeModules = payload.moduleCodes?.length
        ? payload.moduleCodes
        : template.defaultModules;

      await this.provisionModules(
        payload.tenantId,
        activeModules,
        payload.systemUserId,
      );
      await this.seedAllAccountPlanData(
        payload.tenantId,
        template,
        payload.systemUserId,
      );
      await this.seedRoles(payload.tenantId, template, payload.systemUserId);
      await this.seedDefaultCategories(
        payload.tenantId,
        payload.systemUserId,
        template,
      );
      await this.seedTenantSettings(
        payload.tenantId,
        payload.systemUserId,
        template,
      );
      await this.seedModuleSettings(
        payload.tenantId,
        payload.systemUserId,
        template,
        activeModules,
      );
      this.logger.log(
        `✅ Seeding completado para Tenant: ${payload.tenantId} con módulos: ${activeModules.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error durante el seeding del Tenant ${payload.tenantId}:`,
        error,
      );
    }
  }

  private async provisionModules(
    tenantId: string,
    moduleCodes: string[],
    userId?: string,
  ) {
    this.logger.log(
      `Provisionando ${moduleCodes.length} módulos para tenant: ${tenantId}`,
    );
    const values = moduleCodes.map((code) => ({
      tenantId,
      moduleCode: code as any,
      status: 'ENABLED' as const,
      activatedBy: userId || null,
      activatedAt: new Date(),
      createdById: userId || null,
      updatedById: userId || null,
    }));
    if (values.length > 0) {
      await this.db
        .insert(tenantModules)
        .values(values)
        .onConflictDoNothing({
          target: [tenantModules.tenantId, tenantModules.moduleCode],
        });
    }
  }

  private async seedAllAccountPlanData(
    tenantId: string,
    template: any,
    systemUserId?: string,
  ) {
    const accountsToInsert: AccountEntry[] = template?.accounts ?? [];

    if (accountsToInsert.length === 0) {
      this.logger.warn(
        `No accounts defined in template for tenant: ${tenantId}`,
      );
      return;
    }

    const sorted = [...accountsToInsert].sort((a, b) => a.level - b.level);

    const parentIdCache: Record<string, string> = {};

    for (const acc of sorted) {
      const parentAccountId = acc.parentCode
        ? parentIdCache[acc.parentCode] || null
        : null;

      const [insertedAccount] = await this.db
        .insert(accountPlan)
        .values({
          tenantId,
          code: acc.code,
          name: acc.name,
          description: null,
          accountType: acc.accountType,
          nature: acc.nature,
          level: acc.level,
          allowsMovements: acc.allowsMovements,
          parentAccountId,
          isActive: acc.isActive,
          createdById: systemUserId || null,
          updatedById: systemUserId || null,
        })
        .onConflictDoNothing()
        .returning({ id: accountPlan.id, code: accountPlan.code });

      if (insertedAccount) {
        parentIdCache[acc.code] = insertedAccount.id;
      } else if (acc.code) {
        const existingAccount = await this.db.query.accountPlan.findFirst({
          where: (ap, { eq, and }) =>
            and(eq(ap.code, acc.code), eq(ap.tenantId, tenantId)),
          columns: { id: true },
        });
        if (existingAccount) {
          parentIdCache[acc.code] = existingAccount.id;
        }
      }
    }
  }

  private async seedRoles(
    tenantId: string,
    template: any,
    idSuperadmin: string | undefined,
  ) {
    this.logger.log(`Sembrando roles por defecto para tenant: ${tenantId}`);

    const allPermissions = await this.db.query.permissions.findMany();

    const roleList = template.roles;

    for (const roleData of roleList) {
      // ✅ CORRECCIÓN CRÍTICA: Buscar si el rol existe, pero AISLADO POR TENANT
      const existingRole = await this.db.query.roles.findFirst({
        where: (rolesTable, { eq, and }) =>
          and(
            eq(rolesTable.name, roleData.name),
            eq(rolesTable.tenantId, tenantId), // ¡Sin esto, las demás empresas nacen sin roles!
          ),
      });

      if (existingRole) {
        this.logger.log(
          `Role '${roleData.name}' already exists for this tenant`,
        );
        continue;
      }

      const [role] = await this.db
        .insert(roles)
        .values({
          tenantId: tenantId,
          name: roleData.name,
          description: roleData.description,
          isDefault: roleData.isDefault,
          createdById: idSuperadmin || null,
          updatedById: idSuperadmin || null,
        })
        .returning();

      // ✅ LÓGICA ESTRATÉGICA DE ASIGNACIÓN
      let permsToAssign: typeof allPermissions = [];

      switch (roleData.name) {
        case 'admin':
          // El Admin de la empresa tiene todo lo que sea "tenant", pero NADA "global" o "all"
          permsToAssign = allPermissions.filter((p) => p.scope === 'tenant');
          break;

        case 'executive':
          // Ejecutivos: Todo lo de ahorros y cartera, más lectura de reportes contables
          permsToAssign = allPermissions.filter(
            (p) =>
              p.resource.startsWith('savings:') ||
              p.resource.startsWith('portfolio:') ||
              (p.resource === 'accounting:reports' && p.action === 'read'),
          );
          break;

        case 'accountant':
          // Contador: Contabilidad, Bancos, y lectura de operaciones para justificar
          permsToAssign = allPermissions.filter(
            (p) =>
              p.resource.startsWith('accounting:') ||
              p.resource.startsWith('banking:') ||
              (p.resource.startsWith('savings:') && p.action === 'read') ||
              (p.resource.startsWith('portfolio:') && p.action === 'read'),
          );
          break;

        case 'assistant':
          // Operativo: Solo pueden crear y leer en ahorros y cartera, NUNCA aprobar ni desembolsar
          permsToAssign = allPermissions.filter(
            (p) =>
              (p.resource.startsWith('savings:') ||
                p.resource.startsWith('portfolio:')) &&
              (p.action === 'create' || p.action === 'read'),
          );
          break;
      }

      // ✅ OPTIMIZACIÓN 2: BULK INSERT (Inserción Masiva)
      if (permsToAssign.length > 0) {
        // Preparamos el array de objetos
        const rolePermissionsData = permsToAssign.map((perm) => ({
          roleId: role.id,
          permissionId: perm.id,
          isCustom: false,
        }));

        // Insertamos los 30 o 50 permisos en un solo viaje a la base de datos
        await this.db.insert(rolePermissions).values(rolePermissionsData);

        this.logger.log(
          `Created '${roleData.name}' role with ${permsToAssign.length} permissions.`,
        );
      } else {
        this.logger.log(`Created '${roleData.name}' role with 0 permissions.`);
      }
    }
  }

  private async seedDefaultCategories(
    tenantId: string,
    systemUserId?: string,
    template?: any,
  ) {
    const cats = template?.categories ?? [];
    for (const cat of cats) {
      const existing = await this.db.query.categories.findFirst({
        where: (c, { and, eq }) =>
          and(eq(c.type, cat.type), eq(c.code, cat.code)),
      });

      if (!existing) {
        await this.db.insert(categories).values({
          type: cat.type,
          code: cat.code,
          name: cat.name,
          tenantId: tenantId,
          options: cat.metadata ? JSON.stringify(cat.metadata) : null,
          isActive: true,
          createdById: systemUserId || null,
          updatedById: systemUserId || null,
        });
      }
    }
  }

  private async seedTenantSettings(
    tenantId: string,
    userId?: string,
    template?: any,
  ) {
    const settings = template?.settings ?? [];

    const settingsToInsert = settings.map((setting: any) => ({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      category: setting.category,
      tenantId,
      createdById: userId || null,
      updatedById: userId || null,
    }));

    if (settingsToInsert.length > 0) {
      await this.db
        .insert(tenantSettings)
        .values(settingsToInsert)
        .onConflictDoNothing({
          target: [tenantSettings.tenantId, tenantSettings.key],
        });
    }
  }

  private async seedModuleSettings(
    tenantId: string,
    userId?: string,
    template?: any,
    activeModules?: string[],
  ) {
    const allModuleSettings = template?.moduleSettings ?? [];

    const filtered = activeModules?.length
      ? allModuleSettings.filter((s: any) => {
          const moduleUpper = s.module.toUpperCase();
          if (moduleUpper === 'PORTFOLIO') {
            return (
              activeModules.includes('LOANS') ||
              activeModules.includes('CREDITS')
            );
          }
          return activeModules.includes(moduleUpper);
        })
      : allModuleSettings;

    const moduleSettingsToInsert = filtered.map((setting: any) => ({
      module: setting.module,
      submodule: setting.submodule,
      key: setting.key,
      value: setting.value,
      description: setting.description,
      tenantId,
      isActive: true,
      createdBy: userId || null,
      updatedBy: userId || null,
    }));

    if (moduleSettingsToInsert.length > 0) {
      await this.db
        .insert(moduleSettings)
        .values(moduleSettingsToInsert)
        .onConflictDoNothing({
          target: [
            moduleSettings.tenantId,
            moduleSettings.module,
            moduleSettings.submodule,
            moduleSettings.key,
          ],
        });
    }
  }
}
