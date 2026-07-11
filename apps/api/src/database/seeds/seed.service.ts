import * as schema from '@/database/schema';
import {
  bankDirectory,
  currencies,
  globalSettings,
  localities,
  municipalities,
  parishes,
  permissions,
  states,
  users,
} from '@/database/schema';
import { SecurityService } from '@/features/core/security/security.service';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '../drizzle-provider';
import { banks } from './default-system/directory-bank';
import { Localities } from './default-system/Localities';
import { Municipalities } from './default-system/Municipalities';
import { Parishes } from './default-system/Parishes';
import { DEFAULT_PERMISSIONS } from './default-system/permision';
import { States } from './default-system/States';

const SUPERADMIN_USER = {
  username: 'superadmin',
  email: 'zonastartceo@gmail.com',
  fullname: 'Super Administrator',
  password: 'admin123',
  status: 'active',
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  private idSuperadmin: string;
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly securityService: SecurityService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const shouldSeed = this.configService.get<boolean>('RUN_SEED');

    if (!shouldSeed) {
      this.logger.log('Seed disabled (RUN_SEED not set to "true")');
      return;
    }

    const alreadySeeded = await this.isGloballySeeded();
    if (alreadySeeded) {
      this.logger.log('Global seed already executed, skipping.');
      return;
    }

    this.logger.log('Seed enabled, running...');
    await this.seed();
  }

  private async isGloballySeeded(): Promise<boolean> {
    try {
      const count = await this.db.$count(globalSettings);
      return count > 0;
    } catch {
      return false;
    }
  }

  async seed() {
    this.logger.log('Starting database seed...');

    try {
      await this.seedSuperadmin();
      await this.seedPermissions();
      await this.seedGlobalSettings();
      await this.seedCurrencies();
      await this.seedDirectoryBanks();
      await this.seedStates();
      await this.seedMunicipalities();
      await this.seedParishes();
      await this.seedLocalities();

      this.logger.log('Database seed completed successfully');
    } catch (error) {
      this.logger.error('Error seeding database', error);
    }
  }

  private async seedPermissions() {
    this.logger.log('Seeding permissions...');
    let insertedCount = 0;

    for (const perm of DEFAULT_PERMISSIONS) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(permissions)
        .values({
          ...perm,
          createdById: this.idSuperadmin,
          updatedById: this.idSuperadmin,
        })
        .onConflictDoNothing({
          target: [permissions.resource, permissions.action, permissions.scope],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} permissions`);
  }

  private async seedSuperadmin() {
    this.logger.log('Seeding superadmin user...');

    const hashedPassword = await this.securityService.hashPassword(
      SUPERADMIN_USER.password,
    );

    // ✅ Inserción limpia usando el flag isSystemAdmin. No necesita roles ni permisos.
    const [admin] = await this.db
      .insert(users)
      .values({
        username: SUPERADMIN_USER.username,
        email: SUPERADMIN_USER.email,
        fullname: SUPERADMIN_USER.fullname,
        passwordHash: hashedPassword,
        status: SUPERADMIN_USER.status as any,
        isSystemAdmin: true, // <--- EL MODO DIOS
      })
      .onConflictDoUpdate({
        target: [users.email], // O username, según tu unique index
        set: { isSystemAdmin: true }, // Asegura que siempre tenga el flag, por si acaso
      })
      .returning({ id: users.id });

    this.idSuperadmin = admin.id; // <-- LO ASIGNAMOS
    this.logger.log('✅ Superadmin ready.');
  }

  private async seedDirectoryBanks() {
    this.logger.log('Seeding banks...');
    let insertedCount = 0;

    for (const bank of banks) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(bankDirectory)
        .values({
          code: bank.code,
          name: bank.name,
          createdById: this.idSuperadmin,
          updatedById: this.idSuperadmin,
        })
        .onConflictDoNothing({
          target: [bankDirectory.code],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} banks`);
  }

  private async seedGlobalSettings() {
    this.logger.log('Seeding global settings...');

    const settings = [
      {
        key: 'DEFAULT_TRIAL_DAYS',
        value: '15',
        description: 'Dias de prueba Gratuita',
        category: 'general',
      },
      {
        key: 'MAINTENANCE_MODE',
        value: 'false',
        description: 'Modo Mantenimiento',
        category: 'general',
      },
      {
        key: 'MAX_FILE_UPLOAD_SIZE_MB',
        value: '10',
        description: 'Límite global del peso de los archivos',
        category: 'general',
      },
      {
        key: 'GLOBAL_ANNOUNCEMENT_BANNER',
        value: 'false',
        description: 'Matenimiento Programado',
        category: 'notifications',
      },
      {
        key: 'ALLOWED_REGISTRATION',
        value: 'false',
        description: 'Registro Habilitado',
        category: 'security',
      },
      {
        key: 'FORCE_STRONG_PASSWORDS',
        value: 'false',
        description:
          'Se requiera mayúsculas, números y símbolos en contraseñas',
        category: 'security',
      },
      {
        key: 'JWT_EXPIRES_IN',
        value: '15',
        description: 'Tiempo de vida del token de acceso principal.',
        category: 'security',
      },
      {
        key: 'MAX_LOGIN_ATTEMPTS',
        value: '5',
        description: 'Número máximo de intentos fallidos de contraseña',
        category: 'security',
      },
      {
        key: 'SESSION_TIMEOUT_MINUTES',
        value: '120',
        description: 'Tiempo de inactividad',
        category: 'security',
      },
      {
        key: 'EXCHANGE_RATE_AUTO_SYNC',
        value: 'true',
        description: 'Auto Sincronizacion Tasas de Cambio',
        category: 'system',
      },
    ];

    let insertedCount = 0;

    for (const setting of settings) {
      await this.db
        .insert(globalSettings)
        .values({
          ...setting,
          createdBy: this.idSuperadmin,
          updatedBy: this.idSuperadmin,
        })
        .onConflictDoNothing({
          target: [globalSettings.key], // Usa el key como unique index para no duplicar
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} global settings`);
  }

  private async seedCurrencies() {
    this.logger.log('Seeding currencies...');

    const currenciesData = [
      {
        code: 'VES',
        name: 'Bolivar',
        symbol: 'Bs',
        isBase: false,
        isActive: true,
        decimalPlaces: 2,
      },
      {
        code: 'USD',
        name: 'Dolar Estadounidense',
        symbol: '$',
        isBase: false,
        isActive: true,
        decimalPlaces: 2,
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        isBase: false,
        isActive: true,
        decimalPlaces: 2,
      },
    ];

    let insertedCount = 0;

    for (const currency of currenciesData) {
      await this.db
        .insert(currencies)
        .values({
          ...currency,
          code: currency.code as any,
          createdById: this.idSuperadmin,
          updatedById: this.idSuperadmin,
        })
        .onConflictDoNothing({
          target: [currencies.code], // Usa el código (USD, VES) como unique index
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} currencies`);
  }

  private async seedStates() {
    this.logger.log('Seeding states...');
    let insertedCount = 0;

    for (const state of States) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(states)
        .values(state)
        .onConflictDoNothing({
          target: [states.id],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} states`);
  }
  private async seedMunicipalities() {
    this.logger.log('Seeding municipalities...');
    let insertedCount = 0;

    for (const municipality of Municipalities) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(municipalities)
        .values(municipality)
        .onConflictDoNothing({
          target: [municipalities.id],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} municipalities`);
  }

  private async seedParishes() {
    this.logger.log('Seeding parishes...');
    let insertedCount = 0;

    for (const parish of Parishes) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(parishes)
        .values(parish)
        .onConflictDoNothing({
          target: [parishes.id],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} parishes`);
  }

  private async seedLocalities() {
    this.logger.log('Seeding localities...');
    let insertedCount = 0;

    for (const locality of Localities) {
      // ✅ MEJORA SENIOR: Idempotencia.
      // Si el permiso ya existe (basado en el índice único), lo ignora sin lanzar error.
      await this.db
        .insert(localities)
        .values(locality)
        .onConflictDoNothing({
          target: [localities.id],
        });
      insertedCount++;
    }

    this.logger.log(`Verified/Inserted ${insertedCount} localities`);
  }
}
