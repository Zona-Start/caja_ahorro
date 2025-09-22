import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { accountPlan } from '../index'; // Asegúrate de importar tu esquema

// Función auxiliar para determinar el tipo de cuenta
function determineAccountType(code: string): string {
  if (code.startsWith('1')) return 'ASSET';
  if (code.startsWith('2')) return 'LIABILITY';
  if (code.startsWith('3')) return 'EQUITY';
  if (code.startsWith('4')) return 'REVENUE';
  if (code.startsWith('5')) return 'EXPENSE';
  return 'MEMORANDUM';
}

// Función auxiliar para determinar la naturaleza de la cuenta (simplificado)
function determineAccountNature(code: string): string {
  if (code.startsWith('1') || code.startsWith('5')) return 'DEBIT';
  if (code.startsWith('2') || code.startsWith('3') || code.startsWith('4'))
    return 'CREDIT';

  // Excepciones para cuentas de orden
  if (code.startsWith('61') || code.startsWith('712') || code.startsWith('714'))
    return 'DEBIT';
  if (code.startsWith('62') || code.startsWith('711') || code.startsWith('713'))
    return 'CREDIT';

  // Excepciones para cuentas de crédito en la naturaleza
  if (code === '139.00.00.00' || code.startsWith('159')) return 'CREDIT';

  return 'DEBIT'; // Valor por defecto
}

// Función auxiliar para determinar el nivel de la cuenta
function determineAccountLevel(code: string): number {
  return code.split('.').filter((part) => part !== '00').length;
}

export async function seedAccountPlan(db: NodePgDatabase<typeof schema>) {
  try {
    const accounts = [
      // Rubro 100: ACTIVO
      {
        code: '100.00.00.00',
        name: 'ACTIVO',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '110.00.00.00',
        name: 'DISPONIBILIDAD',
        description: null,
        allowsMovements: false,
        parentCode: '100.00.00.00',
      },
      {
        code: '111.00.00.00',
        name: 'EFECTIVO',
        description: null,
        allowsMovements: true,
        parentCode: '110.00.00.00',
      },
      {
        code: '112.00.00.00',
        name: 'BANCOS',
        description: null,
        allowsMovements: false,
        parentCode: '110.00.00.00',
      },
      {
        code: '112.01.00.00',
        name: 'SECTOR PÚBLICO',
        description: null,
        allowsMovements: false,
        parentCode: '112.00.00.00',
      },
      {
        code: '112.01.01.00',
        name: 'MONEDA NACIONAL',
        description: null,
        allowsMovements: true,
        parentCode: '112.01.00.00',
      },
      {
        code: '112.01.02.00',
        name: 'MONEDA EXTRANJERA',
        description: null,
        allowsMovements: true,
        parentCode: '112.01.00.00',
      },
      {
        code: '112.02.00.00',
        name: 'SECTOR PRIVADO',
        description: null,
        allowsMovements: false,
        parentCode: '112.00.00.00',
      },
      {
        code: '112.02.01.00',
        name: 'MONEDA NACIONAL',
        description: null,
        allowsMovements: true,
        parentCode: '112.02.00.00',
      },
      {
        code: '112.02.02.00',
        name: 'MONEDA EXTRANJERA',
        description: null,
        allowsMovements: true,
        parentCode: '112.02.00.00',
      },
      {
        code: '113.00.00.00',
        name: 'DISPONIBILIDAD RESTRINGIDA',
        description: null,
        allowsMovements: false,
        parentCode: '110.00.00.00',
      },
      {
        code: '113.01.00.00',
        name: 'SECTOR PÚBLICO',
        description: null,
        allowsMovements: true,
        parentCode: '113.00.00.00',
      },
      {
        code: '113.02.00.00',
        name: 'SECTOR PRIVADO',
        description: null,
        allowsMovements: true,
        parentCode: '113.00.00.00',
      },

      {
        code: '120.00.00.00',
        name: 'INVERSIONES',
        description: null,
        allowsMovements: false,
        parentCode: '100.00.00.00',
      },
      {
        code: '121.00.00.00',
        name: 'INVERSIONES A CORTO PLAZO',
        description: null,
        allowsMovements: false,
        parentCode: '120.00.00.00',
      },
      {
        code: '121.01.00.00',
        name: 'TÍTULOS VALORES NEGOCIADOS',
        description: null,
        allowsMovements: true,
        parentCode: '121.00.00.00',
      },
      {
        code: '122.00.00.00',
        name: 'INVERSIONES A LARGO PLAZO',
        description: null,
        allowsMovements: false,
        parentCode: '120.00.00.00',
      },
      {
        code: '122.01.00.00',
        name: 'TÍTULOS VALORES NO NEGOCIADOS',
        description: null,
        allowsMovements: true,
        parentCode: '122.00.00.00',
      },

      {
        code: '130.00.00.00',
        name: 'CARTERA DE CRÉDITOS',
        description: null,
        allowsMovements: false,
        parentCode: '100.00.00.00',
      },
      {
        code: '131.00.00.00',
        name: 'CRÉDITOS OTORGADOS',
        description: null,
        allowsMovements: true,
        parentCode: '130.00.00.00',
      },
      {
        code: '132.00.00.00',
        name: 'CRÉDITOS EN MORA',
        description: null,
        allowsMovements: true,
        parentCode: '130.00.00.00',
      },
      {
        code: '139.00.00.00',
        name: 'PROVISIÓN PARA CRÉDITOS INCOBRABLES',
        description: null,
        allowsMovements: true,
        parentCode: '130.00.00.00',
      },

      {
        code: '140.00.00.00',
        name: 'OTROS ACTIVOS',
        description: null,
        allowsMovements: false,
        parentCode: '100.00.00.00',
      },
      {
        code: '141.00.00.00',
        name: 'CUENTAS POR COBRAR',
        description: null,
        allowsMovements: true,
        parentCode: '140.00.00.00',
      },
      {
        code: '142.00.00.00',
        name: 'INVENTARIOS',
        description: null,
        allowsMovements: true,
        parentCode: '140.00.00.00',
      },
      {
        code: '143.00.00.00',
        name: 'GASTOS PAGADOS POR ANTICIPADO',
        description: null,
        allowsMovements: true,
        parentCode: '140.00.00.00',
      },
      {
        code: '149.00.00.00',
        name: 'OTROS ACTIVOS DIVERSOS',
        description: null,
        allowsMovements: true,
        parentCode: '140.00.00.00',
      },

      {
        code: '150.00.00.00',
        name: 'PROPIEDAD, PLANTA Y EQUIPO',
        description: null,
        allowsMovements: false,
        parentCode: '100.00.00.00',
      },
      {
        code: '151.00.00.00',
        name: 'TERRENOS',
        description: null,
        allowsMovements: true,
        parentCode: '150.00.00.00',
      },
      {
        code: '152.00.00.00',
        name: 'EDIFICIOS',
        description: null,
        allowsMovements: true,
        parentCode: '150.00.00.00',
      },
      {
        code: '153.00.00.00',
        name: 'MOBILIARIO Y EQUIPOS DE OFICINA',
        description: null,
        allowsMovements: true,
        parentCode: '150.00.00.00',
      },
      {
        code: '154.00.00.00',
        name: 'EQUIPOS DE COMPUTACIÓN',
        description: null,
        allowsMovements: true,
        parentCode: '150.00.00.00',
      },
      {
        code: '155.00.00.00',
        name: 'VEHÍCULOS',
        description: null,
        allowsMovements: true,
        parentCode: '150.00.00.00',
      },
      {
        code: '159.00.00.00',
        name: 'DEPRECIACIÓN ACUMULADA',
        description: null,
        allowsMovements: false,
        parentCode: '150.00.00.00',
      },
      {
        code: '159.01.00.00',
        name: 'DEPRECIACIÓN ACUMULADA DE EDIFICIOS',
        description: null,
        allowsMovements: true,
        parentCode: '159.00.00.00',
      },
      {
        code: '159.02.00.00',
        name: 'DEPRECIACIÓN ACUMULADA DE MOBILIARIO Y EQUIPOS DE OFICINA',
        description: null,
        allowsMovements: true,
        parentCode: '159.00.00.00',
      },
      {
        code: '159.03.00.00',
        name: 'DEPRECIACIÓN ACUMULADA DE EQUIPOS DE COMPUTACIÓN',
        description: null,
        allowsMovements: true,
        parentCode: '159.00.00.00',
      },
      {
        code: '159.04.00.00',
        name: 'DEPRECIACIÓN ACUMULADA DE VEHÍCULOS',
        description: null,
        allowsMovements: true,
        parentCode: '159.00.00.00',
      },

      // Rubro 200: PASIVO
      {
        code: '200.00.00.00',
        name: 'PASIVO',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '210.00.00.00',
        name: 'OBLIGACIONES CON EL PÚBLICO',
        description: null,
        allowsMovements: false,
        parentCode: '200.00.00.00',
      },
      {
        code: '211.00.00.00',
        name: 'DEPÓSITOS DE AHORRO',
        description: null,
        allowsMovements: false,
        parentCode: '210.00.00.00',
      },
      {
        code: '211.01.00.00',
        name: 'AHORROS DE ASOCIADOS',
        description: null,
        allowsMovements: true,
        parentCode: '211.00.00.00',
      },
      {
        code: '211.02.00.00',
        name: 'AHORROS DE NO ASOCIADOS',
        description: null,
        allowsMovements: true,
        parentCode: '211.00.00.00',
      },
      {
        code: '212.00.00.00',
        name: 'DEPÓSITOS A PLAZO',
        description: null,
        allowsMovements: false,
        parentCode: '210.00.00.00',
      },
      {
        code: '212.01.00.00',
        name: 'DEPÓSITOS A PLAZO FIJO',
        description: null,
        allowsMovements: true,
        parentCode: '212.00.00.00',
      },
      {
        code: '212.02.00.00',
        name: 'CERTIFICADOS DE DEPÓSITO',
        description: null,
        allowsMovements: true,
        parentCode: '212.00.00.00',
      },
      {
        code: '219.00.00.00',
        name: 'OTRAS OBLIGACIONES CON EL PÚBLICO',
        description: null,
        allowsMovements: true,
        parentCode: '210.00.00.00',
      },

      {
        code: '220.00.00.00',
        name: 'CUENTAS POR PAGAR',
        description: null,
        allowsMovements: false,
        parentCode: '200.00.00.00',
      },
      {
        code: '221.00.00.00',
        name: 'CUENTAS POR PAGAR A PROVEEDORES',
        description: null,
        allowsMovements: true,
        parentCode: '220.00.00.00',
      },
      {
        code: '222.00.00.00',
        name: 'CUENTAS POR PAGAR A EMPLEADOS',
        description: null,
        allowsMovements: true,
        parentCode: '220.00.00.00',
      },
      {
        code: '223.00.00.00',
        name: 'IMPUESTOS POR PAGAR',
        description: null,
        allowsMovements: true,
        parentCode: '220.00.00.00',
      },
      {
        code: '224.00.00.00',
        name: 'RETENCIONES POR PAGAR',
        description: null,
        allowsMovements: true,
        parentCode: '220.00.00.00',
      },
      {
        code: '229.00.00.00',
        name: 'OTRAS CUENTAS POR PAGAR',
        description: null,
        allowsMovements: true,
        parentCode: '220.00.00.00',
      },

      {
        code: '230.00.00.00',
        name: 'OBLIGACIONES FINANCIERAS',
        description: null,
        allowsMovements: false,
        parentCode: '200.00.00.00',
      },
      {
        code: '231.00.00.00',
        name: 'PRÉSTAMOS BANCARIOS',
        description: null,
        allowsMovements: true,
        parentCode: '230.00.00.00',
      },
      {
        code: '232.00.00.00',
        name: 'OBLIGACIONES CON INSTITUCIONES FINANCIERAS',
        description: null,
        allowsMovements: true,
        parentCode: '230.00.00.00',
      },
      {
        code: '239.00.00.00',
        name: 'OTRAS OBLIGACIONES FINANCIERAS',
        description: null,
        allowsMovements: true,
        parentCode: '230.00.00.00',
      },

      {
        code: '240.00.00.00',
        name: 'PROVISIONES',
        description: null,
        allowsMovements: false,
        parentCode: '200.00.00.00',
      },
      {
        code: '241.00.00.00',
        name: 'PROVISIÓN PARA PRESTACIONES SOCIALES',
        description: null,
        allowsMovements: true,
        parentCode: '240.00.00.00',
      },
      {
        code: '242.00.00.00',
        name: 'PROVISIÓN PARA VACACIONES',
        description: null,
        allowsMovements: true,
        parentCode: '240.00.00.00',
      },
      {
        code: '249.00.00.00',
        name: 'OTRAS PROVISIONES',
        description: null,
        allowsMovements: true,
        parentCode: '240.00.00.00',
      },

      // Rubro 300: PATRIMONIO
      {
        code: '300.00.00.00',
        name: 'PATRIMONIO',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '310.00.00.00',
        name: 'CAPITAL SOCIAL',
        description: null,
        allowsMovements: false,
        parentCode: '300.00.00.00',
      },
      {
        code: '311.00.00.00',
        name: 'CAPITAL SUSCRITO Y PAGADO',
        description: null,
        allowsMovements: true,
        parentCode: '310.00.00.00',
      },
      {
        code: '312.00.00.00',
        name: 'CAPITAL NO SUSCRITO',
        description: null,
        allowsMovements: true,
        parentCode: '310.00.00.00',
      },

      {
        code: '320.00.00.00',
        name: 'RESERVAS',
        description: null,
        allowsMovements: false,
        parentCode: '300.00.00.00',
      },
      {
        code: '321.00.00.00',
        name: 'RESERVA LEGAL',
        description: null,
        allowsMovements: true,
        parentCode: '320.00.00.00',
      },
      {
        code: '322.00.00.00',
        name: 'RESERVAS ESTATUTARIAS',
        description: null,
        allowsMovements: true,
        parentCode: '320.00.00.00',
      },
      {
        code: '329.00.00.00',
        name: 'OTRAS RESERVAS',
        description: null,
        allowsMovements: true,
        parentCode: '320.00.00.00',
      },

      {
        code: '330.00.00.00',
        name: 'RESULTADOS',
        description: null,
        allowsMovements: false,
        parentCode: '300.00.00.00',
      },
      {
        code: '331.00.00.00',
        name: 'RESULTADOS ACUMULADOS',
        description: null,
        allowsMovements: true,
        parentCode: '330.00.00.00',
      },
      {
        code: '332.00.00.00',
        name: 'RESULTADO DEL EJERCICIO',
        description: null,
        allowsMovements: true,
        parentCode: '330.00.00.00',
      },

      // Rubro 400: INGRESOS
      {
        code: '400.00.00.00',
        name: 'INGRESOS',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '410.00.00.00',
        name: 'INGRESOS POR OPERACIONES',
        description: null,
        allowsMovements: false,
        parentCode: '400.00.00.00',
      },
      {
        code: '411.00.00.00',
        name: 'INTERESES GANADOS',
        description: null,
        allowsMovements: true,
        parentCode: '410.00.00.00',
      },
      {
        code: '412.00.00.00',
        name: 'COMISIONES GANADAS',
        description: null,
        allowsMovements: true,
        parentCode: '410.00.00.00',
      },
      {
        code: '419.00.00.00',
        name: 'OTROS INGRESOS POR OPERACIONES',
        description: null,
        allowsMovements: true,
        parentCode: '410.00.00.00',
      },

      {
        code: '420.00.00.00',
        name: 'OTROS INGRESOS',
        description: null,
        allowsMovements: false,
        parentCode: '400.00.00.00',
      },
      {
        code: '421.00.00.00',
        name: 'INGRESOS POR ALQUILERES',
        description: null,
        allowsMovements: true,
        parentCode: '420.00.00.00',
      },
      {
        code: '422.00.00.00',
        name: 'INGRESOS POR VENTA DE ACTIVOS',
        description: null,
        allowsMovements: true,
        parentCode: '420.00.00.00',
      },
      {
        code: '429.00.00.00',
        name: 'OTROS INGRESOS DIVERSOS',
        description: null,
        allowsMovements: true,
        parentCode: '420.00.00.00',
      },

      // Rubro 500: EGRESOS
      {
        code: '500.00.00.00',
        name: 'EGRESOS',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '510.00.00.00',
        name: 'GASTOS DE OPERACIÓN',
        description: null,
        allowsMovements: false,
        parentCode: '500.00.00.00',
      },
      {
        code: '511.00.00.00',
        name: 'GASTOS DE PERSONAL',
        description: null,
        allowsMovements: true,
        parentCode: '510.00.00.00',
      },
      {
        code: '512.00.00.00',
        name: 'GASTOS ADMINISTRATIVOS',
        description: null,
        allowsMovements: true,
        parentCode: '510.00.00.00',
      },
      {
        code: '513.00.00.00',
        name: 'GASTOS DE VENTAS',
        description: null,
        allowsMovements: true,
        parentCode: '510.00.00.00',
      },
      {
        code: '514.00.00.00',
        name: 'GASTOS FINANCIEROS',
        description: null,
        allowsMovements: true,
        parentCode: '510.00.00.00',
      },
      {
        code: '519.00.00.00',
        name: 'OTROS GASTOS DE OPERACIÓN',
        description: null,
        allowsMovements: true,
        parentCode: '510.00.00.00',
      },

      {
        code: '520.00.00.00',
        name: 'OTROS EGRESOS',
        description: null,
        allowsMovements: false,
        parentCode: '500.00.00.00',
      },
      {
        code: '521.00.00.00',
        name: 'GASTOS POR DEPRECIACIÓN',
        description: null,
        allowsMovements: true,
        parentCode: '520.00.00.00',
      },
      {
        code: '522.00.00.00',
        name: 'GASTOS POR AMORTIZACIÓN',
        description: null,
        allowsMovements: true,
        parentCode: '520.00.00.00',
      },
      {
        code: '529.00.00.00',
        name: 'OTROS EGRESOS DIVERSOS',
        description: null,
        allowsMovements: true,
        parentCode: '520.00.00.00',
      },

      // Rubro 600: CUENTAS DE ORDEN
      {
        code: '600.00.00.00',
        name: 'CUENTAS DE ORDEN',
        description: null,
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '610.00.00.00',
        name: 'DEUDORAS',
        description: null,
        allowsMovements: false,
        parentCode: '600.00.00.00',
      },
      {
        code: '611.00.00.00',
        name: 'VALORES EN CUSTODIA',
        description: null,
        allowsMovements: true,
        parentCode: '610.00.00.00',
      },
      {
        code: '612.00.00.00',
        name: 'BIENES RECIBIDOS EN GARANTÍA',
        description: null,
        allowsMovements: true,
        parentCode: '610.00.00.00',
      },
      {
        code: '619.00.00.00',
        name: 'OTRAS CUENTAS DE ORDEN DEUDORAS',
        description: null,
        allowsMovements: true,
        parentCode: '610.00.00.00',
      },

      {
        code: '620.00.00.00',
        name: 'ACREEDORAS',
        description: null,
        allowsMovements: false,
        parentCode: '600.00.00.00',
      },
      {
        code: '621.00.00.00',
        name: 'RESPONSABILIDAD POR VALORES EN CUSTODIA',
        description: null,
        allowsMovements: true,
        parentCode: '620.00.00.00',
      },
      {
        code: '622.00.00.00',
        name: 'RESPONSABILIDAD POR BIENES RECIBIDOS EN GARANTÍA',
        description: null,
        allowsMovements: true,
        parentCode: '620.00.00.00',
      },
      {
        code: '629.00.00.00',
        name: 'OTRAS CUENTAS DE ORDEN ACREEDORAS',
        description: null,
        allowsMovements: true,
        parentCode: '620.00.00.00',
      },

      // Rubro 700: OTRAS CUENTAS DE ORDEN
      {
        code: '700.00.00.00',
        name: 'OTRAS CUENTAS DE ORDEN',
        description:
          'Rubro adicional para cuentas de orden no clasificadas en los grupos 610 y 620.',
        allowsMovements: false,
        parentCode: null,
      },
      {
        code: '710.00.00.00',
        name: 'CUENTAS DE ORDEN ACREEDORAS',
        description: 'Representa la responsabilidad de la asociación...',
        allowsMovements: false,
        parentCode: '700.00.00.00',
      },
      {
        code: '711.00.00.00',
        name: 'GARANTÍAS RECIBIDAS',
        description: null,
        allowsMovements: false,
        parentCode: '710.00.00.00',
      },
      {
        code: '711.01.00.00',
        name: 'FIANZAS',
        description: null,
        allowsMovements: true,
        parentCode: '711.00.00.00',
      },
      {
        code: '712.00.00.00',
        name: 'GARANTÍAS OTORGADAS',
        description: null,
        allowsMovements: false,
        parentCode: '710.00.00.00',
      },
      {
        code: '712.01.00.00',
        name: 'FIANZAS',
        description: null,
        allowsMovements: true,
        parentCode: '712.00.00.00',
      },
      {
        code: '713.00.00.00',
        name: 'FONDOS ADMINISTRADOS',
        description: null,
        allowsMovements: false,
        parentCode: '710.00.00.00',
      },
      {
        code: '713.01.00.00',
        name: 'MONTEPÍO',
        description: null,
        allowsMovements: true,
        parentCode: '713.00.00.00',
      },
      {
        code: '713.02.00.00',
        name: 'MUTUO AUXILIO',
        description: null,
        allowsMovements: true,
        parentCode: '713.00.00.00',
      },
      {
        code: '713.03.00.00',
        name: 'PRESTACIONES SOCIALES FIDEICOMISO',
        description: null,
        allowsMovements: true,
        parentCode: '713.00.00.00',
      },
      {
        code: '714.00.00.00',
        name: 'CUENTAS DE REGISTRO',
        description: null,
        allowsMovements: false,
        parentCode: '710.00.00.00',
      },
      {
        code: '714.01.00.00',
        name: 'EXCEDENTES Y HABERES NO RECLAMADOS',
        description: null,
        allowsMovements: true,
        parentCode: '714.00.00.00',
      },
      {
        code: '714.99.00.00',
        name: 'OTRAS CUENTAS DE REGISTROS',
        description: null,
        allowsMovements: true,
        parentCode: '714.00.00.00',
      },
    ];

    const parentIdCache: { [key: string]: number } = {};

    for (const acc of accounts) {
      const parentAccountId = acc.parentCode
        ? parentIdCache[acc.parentCode]
        : null;

      const [insertedAccount] = await db
        .insert(accountPlan)
        .values({
          companyId: 1,
          code: acc.code,
          name: acc.name,
          description: acc.description,
          accountType: determineAccountType(acc.code),
          nature: determineAccountNature(acc.code),
          level: determineAccountLevel(acc.code),
          allowsMovements: acc.allowsMovements,
          parentAccountId: parentAccountId,
          isActive: true,
          createdById: 1,
          updatedById: 1,
        })
        .onConflictDoNothing()
        .returning({ id: accountPlan.id });

      if (insertedAccount) {
        parentIdCache[acc.code] = insertedAccount.id;
      }
    }

    console.log('Account plan seeded successfully');
  } catch (error) {
    console.error('Error seeding account plan:', error);
  }
}
