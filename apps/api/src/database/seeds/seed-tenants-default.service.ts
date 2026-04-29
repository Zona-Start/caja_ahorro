import * as schema from '@/database/schema';
import {
  accountPlan,
  categories,
  moduleSettings,
  rolePermissions,
  roles,
  tenantSettings,
} from '@/database/schema'; // Ajusta la ruta a tu schema
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '../drizzle-provider';

// IMPORTANTE: Importa aquí tus arrays de rawAccounts
import { CategoriesSeed } from './default-tenant/categories.seed';
import {
  DEFAULT_MODULE_SETTINGS,
  DEFAULT_TENANT_SETTINGS,
} from './default-tenant/default-settings.data';
import {
  rawAccounts1,
  rawAccounts2,
  rawAccounts3,
  rawAccounts4,
  rawAccounts5,
  rawAccounts6,
  rawAccounts7,
} from './default-tenant/raw-accounts';
import { DEFAULT_ROLES } from './default-tenant/roles';

interface RawAccount {
  code: string;
  aux?: string;
  name: string;
  allowsMovements: boolean;
  parentCode?: string | null;
}

// Define la interfaz del payload que enviará tu controlador/servicio de Tenants
export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: string, // UUID del nuevo tenant
    public readonly systemUserId?: string, // Opcional: UUID del usuario sistema/creador
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
      `Iniciando seeding del Plan de Cuentas para el Tenant: ${payload.tenantId}`,
    );
    try {
      await this.seedAllAccountPlanData(payload.tenantId, payload.systemUserId);
      await this.seedRoles(payload.tenantId, payload.systemUserId);
      await this.seedDefaultCategories(payload.tenantId, payload.systemUserId);
      await this.seedTenantSettings(payload.tenantId, payload.systemUserId);
      await this.seedModuleSettings(payload.tenantId, payload.systemUserId);
      this.logger.log(
        `✅ Seeding del Plan de Cuentas completado para el Tenant: ${payload.tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error durante el seeding del Tenant ${payload.tenantId}:`,
        error,
      );
    }
  }

  private async seedAllAccountPlanData(
    tenantId: string,
    systemUserId?: string,
  ) {
    // 1. CONSOLIDAR TODOS LOS DATOS CRUDOS
    const allRawAccounts: RawAccount[] = [
      { code: '100-00-00-00', name: 'ACTIVOS', allowsMovements: false },
      { code: '200-00-00-00', name: 'PASIVOS', allowsMovements: false },
      { code: '300-00-00-00', name: 'PATRIMONIO', allowsMovements: false },
      { code: '400-00-00-00', name: 'INGRESOS', allowsMovements: false },
      { code: '500-00-00-00', name: 'EGRESOS', allowsMovements: false },
      {
        code: '600-00-00-00',
        name: 'CUENTAS DE ORDEN DEUDORAS',
        allowsMovements: false,
      },
      {
        code: '700-00-00-00',
        name: 'CUENTAS DE ORDEN ACREEDORAS',
        allowsMovements: false,
      },
      ...rawAccounts1,
      ...rawAccounts2,
      ...rawAccounts3,
      ...rawAccounts4,
      ...rawAccounts5,
      ...rawAccounts6,
      ...rawAccounts7,
    ];

    // 2. PROCESAR Y ORDENAR LAS CUENTAS
    const accountsToInsert = this.processAccounts(allRawAccounts);

    // 3. INSERCIÓN EN BASE DE DATOS
    // Nota: Como estamos en BD modernas/UUID, la caché ahora es string (UUID)
    const parentIdCache: Record<string, string> = {};

    for (const acc of accountsToInsert) {
      const parentAccountId = acc.parentCode
        ? parentIdCache[acc.parentCode] || null
        : null;

      const accountType = this.determineAccountType(acc.code);
      const nature = this.determineAccountNature(acc.code);

      const [insertedAccount] = await this.db
        .insert(accountPlan)
        .values({
          tenantId: tenantId, // ✅ Usamos el UUID del tenant inyectado
          code: acc.code,
          name: acc.name,
          description: acc.description,
          accountType: accountType as any,
          nature: nature as any,
          level: acc.level,
          allowsMovements: acc.allowsMovements,
          parentAccountId: parentAccountId,
          isActive: true,
          // Si tienes auditoría de quién creó el registro, usa el ID inyectado o uno nulo
          createdBy: systemUserId || null,
          updatedBy: systemUserId || null,
        })
        .onConflictDoNothing({
          // Opcional: Especifica el target de conflicto si tienes un Unique Index (ej. tenantId + code)
          // target: [accountPlan.tenantId, accountPlan.code]
        })
        .returning({ id: accountPlan.id, code: accountPlan.code });

      if (insertedAccount) {
        parentIdCache[acc.code] = insertedAccount.id;
      } else if (acc.code) {
        // Si ya existía (ej. si el evento se dispara dos veces), buscamos su ID
        const existingAccount = await this.db.query.accountPlan.findFirst({
          where: (ap, { eq, and }) =>
            and(
              eq(ap.code, acc.code),
              eq(ap.tenantId, tenantId), // Importante aislar por tenant
            ),
          columns: { id: true },
        });
        if (existingAccount) {
          parentIdCache[acc.code] = existingAccount.id;
        }
      }
    }
  }

  // === MÉTODOS PRIVADOS DE LÓGICA (Tus funciones encapsuladas) ===

  private processAccounts(accounts: RawAccount[]) {
    const processed = accounts.map((acc) => {
      const baseCode = this.formatCode(acc.code);
      const finalCode = acc.aux ? `${baseCode}.${acc.aux}` : baseCode;

      const parentCode = acc.parentCode
        ? acc.parentCode
        : acc.aux
          ? baseCode
          : this.getParentCode(finalCode);

      const level = this.determineAccountLevel(finalCode);

      return {
        code: finalCode,
        name: acc.name,
        description: acc.aux
          ? `Cuenta auxiliar ${acc.aux} de ${baseCode}`
          : null,
        allowsMovements: acc.allowsMovements,
        parentCode: parentCode,
        level: level,
      };
    });

    processed.sort((a, b) => a.level - b.level);
    return processed;
  }

  private formatCode(code: string): string {
    const parts = code.split('-');
    return `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
  }

  private determineAccountLevel(code: string): number {
    const parts = code.split('.');
    let level = 0;
    if (parts[0] && parts[0] !== '000') level = 1;
    if (parts[1] && parts[1] !== '00') level = 2;
    if (parts[2] && parts[2] !== '00') level = 3;
    if (parts[3] && parts[3] !== '00') level = 4;
    if (parts.length > 4 && parts[4] && parts[4] !== '000') level = 5;
    return level;
  }

  private getParentCode(formattedCode: string): string | null {
    const parts = formattedCode.split('.');
    let parentCodeParts: string[] = [...parts];

    if (parts.length === 5) {
      parentCodeParts.pop();
      return parentCodeParts.join('.');
    }

    let lastNonZeroIndex = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] !== '00' && parts[i] !== '000') {
        lastNonZeroIndex = i;
        break;
      }
    }

    if (lastNonZeroIndex <= 0) return null;

    const parentParts = [...parts];
    parentParts[lastNonZeroIndex] = '00';
    for (let i = lastNonZeroIndex + 1; i < parentParts.length; i++) {
      parentParts[i] = '00';
    }
    return parentParts.join('.');
  }

  private determineAccountType(code: string): string {
    const mainGroup = code.split('.')[0];
    if (mainGroup.startsWith('1')) return 'ASSET';
    if (mainGroup.startsWith('2')) return 'LIABILITY';
    if (mainGroup.startsWith('3')) return 'EQUITY';
    if (mainGroup.startsWith('4')) return 'REVENUE';
    if (mainGroup.startsWith('5')) return 'EXPENSE';
    if (mainGroup.startsWith('6') || mainGroup.startsWith('7'))
      return 'MEMORANDUM';
    return 'MEMORANDUM';
  }

  private determineAccountNature(code: string): string {
    const mainGroup = code.split('.')[0];

    if (mainGroup.startsWith('1') || mainGroup.startsWith('5')) return 'DEBIT';
    if (
      mainGroup.startsWith('2') ||
      mainGroup.startsWith('3') ||
      mainGroup.startsWith('4')
    )
      return 'CREDIT';

    if (mainGroup.startsWith('6')) {
      const subGroup = code.split('.')[1];
      if (subGroup.startsWith('1')) return 'DEBIT';
      if (subGroup.startsWith('2')) return 'CREDIT';
    }

    if (mainGroup.startsWith('7')) {
      const subGroup = code.split('.')[1];
      if (subGroup.startsWith('11') || subGroup.startsWith('13'))
        return 'CREDIT';
      if (subGroup.startsWith('12') || subGroup.startsWith('14'))
        return 'DEBIT';
    }

    if (code.startsWith('139') || code.startsWith('159')) return 'CREDIT';

    return 'DEBIT';
  }

  private async seedRoles(tenantId: string, idSuperadmin: string | undefined) {
    this.logger.log(`Sembrando roles por defecto para tenant: ${tenantId}`);

    // ✅ OPTIMIZACIÓN 1: Traemos todos los permisos del catálogo UNA SOLA VEZ a memoria.
    // Como son pocos (unos 50-100), es súper rápido y evitamos golpear la BD repetidas veces.
    const allPermissions = await this.db.query.permissions.findMany();

    for (const roleData of DEFAULT_ROLES) {
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

  private async seedDefaultCategories(tenantId: string, systemUserId?: string) {
    for (const cat of CategoriesSeed) {
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

        this.logger.log(`Created '${cat.name}' category.`);
      } else {
        this.logger.log(
          `Category '${cat.name}' already exists for this tenant`,
        );
        continue;
      }
    }
  }

  private async seedTenantSettings(tenantId: string, userId?: string) {
    this.logger.log(`Sembrando Tenant Settings para: ${tenantId}`);

    const settingsToInsert = DEFAULT_TENANT_SETTINGS.map((setting) => ({
      ...setting,
      tenantId,
      createdBy: userId || null,
      updatedBy: userId || null,
    }));

    if (settingsToInsert.length > 0) {
      await this.db
        .insert(tenantSettings)
        .values(settingsToInsert)
        .onConflictDoNothing({
          target: [tenantSettings.tenantId, tenantSettings.key], // Evita duplicados
        });
    }
  }

  private async seedModuleSettings(tenantId: string, userId?: string) {
    this.logger.log(`Sembrando Module Settings para: ${tenantId}`);

    const moduleSettingsToInsert = DEFAULT_MODULE_SETTINGS.map((setting) => ({
      ...setting,
      tenantId,
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
