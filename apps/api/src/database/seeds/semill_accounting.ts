import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { accountPlan } from '../index'; // Asegúrate de importar tu esquema

/**
 * Normaliza el código de la imagen de NNN-NN-NN-NN a NNN.NN.NN.NN.
 */
function formatCode(code: string): string {
  const parts = code.split('-');
  // Asegura que el formato es siempre NNN.NN.NN.NN
  return `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
}

/**
 * Determina el nivel jerárquico de la cuenta.
 * Admite el formato base (NNN.NN.NN.NN) y el auxiliar (NNN.NN.NN.NN.NNN).
 */
function determineAccountLevel(code: string): number {
  const parts = code.split('.');
  let level = 0;
  if (parts[0] && parts[0] !== '000') level = 1; // Grupo (100)
  if (parts[1] && parts[1] !== '00') level = 2; // Rubro (110)
  if (parts[2] && parts[2] !== '00') level = 3; // Cuenta (111)
  if (parts[3] && parts[3] !== '00') level = 4; // Sub-cuenta (111.01)
  if (parts.length > 4 && parts[4] && parts[4] !== '000') level = 5; // Auxiliar (001)
  return level;
}

/**
 * Calcula el código del padre (NNN.NN.NN.NN) basado en el código hijo.
 */
function getParentCode(formattedCode: string): string | null {
  const parts = formattedCode.split('.');
  let parentCodeParts: string[] = [...parts];

  // Caso 1: Si es una cuenta auxiliar (nivel 5), el padre es el nivel 4
  if (parts.length === 5) {
    parentCodeParts.pop();
    return parentCodeParts.join('.');
  }

  // Caso 2: Para niveles 1 a 4 (e.g., de 112.01.00.00 a 112.00.00.00)
  let lastNonZeroIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== '00' && parts[i] !== '000') {
      lastNonZeroIndex = i;
      break;
    }
  }

  if (lastNonZeroIndex <= 0) {
    return null; // Es una cuenta de grupo principal (e.g., 100.00.00.00 o 1.00.00.00.00)
  }

  const parentParts = [...parts];
  parentParts[lastNonZeroIndex] = '00';
  for (let i = lastNonZeroIndex + 1; i < parentParts.length; i++) {
    parentParts[i] = '00';
  }
  return parentParts.join('.');
}

/**
 * Determina el tipo de cuenta (ASSET, LIABILITY, etc.)
 */
function determineAccountType(code: string): string {
  const mainGroup = code.split('.')[0];
  if (mainGroup.startsWith('1')) return 'ASSET';
  if (mainGroup.startsWith('2')) return 'LIABILITY';
  if (mainGroup.startsWith('3')) return 'EQUITY';
  if (mainGroup.startsWith('4')) return 'REVENUE';
  if (mainGroup.startsWith('5')) return 'EXPENSE';
  // 6xx y 7xx son Cuentas de Orden
  if (mainGroup.startsWith('6') || mainGroup.startsWith('7'))
    return 'MEMORANDUM';
  return 'MEMORANDUM';
}

/**
 * Determina la naturaleza de la cuenta (DEBIT o CREDIT).
 */
function determineAccountNature(code: string): string {
  const mainGroup = code.split('.')[0];

  // Deudoras: Activos (1) y Egresos (5)
  if (mainGroup.startsWith('1') || mainGroup.startsWith('5')) return 'DEBIT';

  // Acreedoras: Pasivos (2), Patrimonio (3), Ingresos (4)
  if (
    mainGroup.startsWith('2') ||
    mainGroup.startsWith('3') ||
    mainGroup.startsWith('4')
  )
    return 'CREDIT';

  // Cuentas de Orden (6xx y 7xx): se determinan por el rubro
  if (mainGroup.startsWith('6')) {
    // Cuentas de Orden Deudoras (610) vs Acreedoras (620)
    const subGroup = code.split('.')[1];
    if (subGroup.startsWith('1')) return 'DEBIT'; // 610
    if (subGroup.startsWith('2')) return 'CREDIT'; // 620
  }

  if (mainGroup.startsWith('7')) {
    // La estructura 7xx tiene lógica deudor/acreedor inversa o específica
    // En base a los ejemplos de la imagen, 712 (Otorgadas) es Deudora, 711 (Recibidas) es Acreedora
    const subGroup = code.split('.')[1];
    if (subGroup.startsWith('11') || subGroup.startsWith('13')) return 'CREDIT'; // 711, 713
    if (subGroup.startsWith('12') || subGroup.startsWith('14')) return 'DEBIT'; // 712, 714
  }

  // Excepciones de naturaleza inversa
  if (code.startsWith('139') || code.startsWith('159')) return 'CREDIT'; // Provisiones y Depreciación (Cuentas de Activo con saldo Acreedor)

  return 'DEBIT'; // Valor por defecto
}

// === FUNCIÓN PRINCIPAL DE PROCESAMIENTO ===

interface RawAccount {
  code: string; // Formato NNN-NN-NN-NN
  aux?: string; // Formato NNN
  name: string;
  allowsMovements: boolean;
  // CAMBIO APLICADO AQUÍ
  parentCode?: string | null;
}

/**
 * Procesa el array de cuentas crudas, calculando códigos finales, niveles y padres.
 */
function processAccounts(accounts: RawAccount[]): {
  level: number;
  code: string;
  parentCode: string | null;
  description: string | null;
  name: string;
  allowsMovements: boolean;
}[] {
  const processed = accounts.map((acc) => {
    // Código de 4 niveles
    const baseCode = formatCode(acc.code);

    // Código final (con o sin auxiliar)
    const finalCode = acc.aux ? `${baseCode}.${acc.aux}` : baseCode;

    // ParentCode: si es aux, el padre es el baseCode. Si no, se calcula.
    const parentCode = acc.parentCode
      ? acc.parentCode // Uso de parentCode explícito (ej: '713.03.00.00')
      : acc.aux
        ? baseCode
        : getParentCode(finalCode);

    // Nivel: si es aux, el nivel es +1 del padre. Si no, se calcula.
    const level = determineAccountLevel(finalCode);

    return {
      code: finalCode,
      name: acc.name,
      description: acc.aux ? `Cuenta auxiliar ${acc.aux} de ${baseCode}` : null,
      allowsMovements: acc.allowsMovements,
      parentCode: parentCode,
      level: level,
    };
  });

  // Ordenar por nivel para asegurar la inserción jerárquica
  processed.sort((a, b) => a.level - b.level);
  return processed;
}

// --- Datos Extraídos y Adaptados de la Imagen ---
const rawAccounts1: RawAccount[] = [
  // Cuentas de Activo (1xx) - Disponibilidad
  { code: '110-00-00-00', name: 'DISPONIBILIDAD', allowsMovements: false },
  { code: '111-00-00-00', name: 'EFECTIVO', allowsMovements: false },

  // Caja Chica (111.01.00.00)
  { code: '111-01-00-00', name: 'Caja Chica', allowsMovements: false },
  {
    code: '111-01-00-00',
    aux: '001',
    name: 'Caja Chica',
    allowsMovements: true,
  },

  // Caja Principal (111.02.00.00)
  { code: '111-02-00-00', name: 'Caja Principal', allowsMovements: false },
  {
    code: '111-02-00-00',
    aux: '001',
    name: 'Caja en BOLIVARES',
    allowsMovements: true,
  },
  {
    code: '111-02-00-00',
    aux: '002',
    name: 'Caja en DIVISAS',
    allowsMovements: true,
  },

  // Bancos e Instituciones Financieras (112.00.00.00)
  {
    code: '112-00-00-00',
    name: 'Bancos e Instituciones Financieras',
    allowsMovements: false,
  },

  // Sector público (112.01.00.00)
  { code: '112-01-00-00', name: 'Sector público', allowsMovements: false },
  { code: '112-01-01-00', name: 'Moneda Nacional', allowsMovements: false },
  { code: '112-01-01-01', name: 'Cuentas Corrientes', allowsMovements: false },
  {
    code: '112-01-01-01',
    aux: '001',
    name: 'Bicentenario Cta.Cte. 10000186',
    allowsMovements: true,
  },
  {
    code: '112-01-01-01',
    aux: '002',
    name: 'Bicentenario Cta.Cte. 10120168',
    allowsMovements: true,
  },
  {
    code: '112-01-01-01',
    aux: '003',
    name: 'Bicentenario Cta.Cte. 60361548',
    allowsMovements: true,
  },
  {
    code: '112-01-01-01',
    aux: '004',
    name: 'Bicentenario Cta.Cte. 74587150',
    allowsMovements: true,
  },
  { code: '112-01-01-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '112-01-01-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '112-01-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  { code: '112-01-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  { code: '112-01-02-01', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '112-01-02-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '112-01-02-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '112-01-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Sector privado (112.02.00.00)
  { code: '112-02-00-00', name: 'Sector privado', allowsMovements: false },
  { code: '112-02-01-00', name: 'Moneda Nacional', allowsMovements: false },
  { code: '112-02-01-01', name: 'Cuentas Corrientes', allowsMovements: false },
  {
    code: '112-02-01-01',
    aux: '001',
    name: 'Banco Fondo Comun Cta. Cte. 3000550686',
    allowsMovements: true,
  },
  { code: '112-02-01-01', aux: '002', name: 'Banco 3', allowsMovements: true },
  { code: '112-02-01-01', aux: '003', name: 'Banco 4', allowsMovements: true },
  { code: '112-02-01-01', aux: '004', name: 'Banco 5', allowsMovements: true },
  { code: '112-02-01-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '112-02-01-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '112-02-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  { code: '112-02-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  { code: '112-02-02-01', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '112-02-02-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '112-02-02-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '112-02-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Disponibilidad Restringida (115.00.00.00)
  {
    code: '115-00-00-00',
    name: 'Disponibilidad Restringida',
    allowsMovements: false,
  },
  { code: '115-01-00-00', name: 'Sector Público', allowsMovements: false },
  {
    code: '115-03-00-00',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  }, // Nota: Este nombre parece genérico para el nivel 115.03

  // Subcuentas de Reserva (115.03.01.xx)
  {
    code: '115-03-01-01',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  {
    code: '115-03-01-01',
    aux: '001',
    name: 'Reserva de Emergencia',
    allowsMovements: true,
  },
  { code: '115-03-01-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '115-03-01-99', name: 'Otras Reservas', allowsMovements: false },

  // Sector Privado Restringido (115.03.02.xx)
  { code: '115-03-02-00', name: 'Sector Privado', allowsMovements: false },
  {
    code: '115-03-02-01',
    name: 'Reservas de Emergencia',
    allowsMovements: false,
  },
  { code: '115-03-02-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '115-03-02-99', name: 'Otras Reservas', allowsMovements: false },

  // Cuentas por Cobrar (113.00.00.00)
  { code: '113-00-00-00', name: 'CUENTAS POR COBRAR', allowsMovements: false },
  {
    code: '113-01-00-00',
    name: 'Cuentas por Cobrar al Empleador',
    allowsMovements: false,
  },

  // 113.01.xx.xx (Cuentas por Cobrar al Empleador - continuación)
  // Nota: 113.01.00.00 ya está en rawAccounts1, aquí se asumen las subcuentas

  // Cuentas por Cobrar a Asociados (113.02.00.00)
  { code: '113-01-01-00', name: 'Aporte del Asociado', allowsMovements: false },
  {
    code: '113-01-01-00',
    aux: '001',
    name: 'Aporte del Asociado x Cobrar',
    allowsMovements: true,
  },

  // Aportes del Empleador (113.02.02.00)
  {
    code: '113-01-02-00',
    name: 'Aporte del Empleador',
    allowsMovements: false,
  },
  {
    code: '113-01-02-00',
    aux: '001',
    name: 'Aporte del Empleador x Cobrar',
    allowsMovements: true,
  },

  // Aporte Voluntario y Retenciones
  {
    code: '113-01-03-00',
    name: 'Aporte Voluntario del Empleador',
    allowsMovements: false,
  },
  {
    code: '113-01-04-00',
    name: 'Retenciones de los Asociados',
    allowsMovements: false,
  },

  // Capital de Préstamo (113.03.00.00)
  { code: '113-01-04-01', name: 'Capital de Prestamo', allowsMovements: false },
  {
    code: '113-01-04-01',
    aux: '002',
    name: 'Retencion Cuota Prestamo Empl.CapreBicen',
    allowsMovements: true,
  }, // Asumo que 002 es la auxiliar

  // Intereses de Préstamo
  { code: '113-01-04-02', name: 'Interes de Prestamo', allowsMovements: false },

  // Otras Cuentas por Cobrar al Empleador
  {
    code: '113-01-09-00',
    name: 'Otras cuentas por cobrar al empleador',
    allowsMovements: false,
  },

  // Vuelven a aparecer las cuentas por cobrar a los asociados (posible error de salto en la imagen, se replican los códigos)
  // Las siguientes son las cuentas reales de 113.02.xx.xx del extracto
  {
    code: '113-02-00-00',
    name: 'Cuentas por Cobrar a los Asociados',
    allowsMovements: false,
  }, // Repetido para asegurar la jerarquía

  // 113.02.xx.xx (Otros conceptos)
  { code: '113-02-01-00', name: 'Aporte del Asociado', allowsMovements: false },
  { code: '113-02-02-00', name: 'Monto Auxilio', allowsMovements: false },
  { code: '113-02-03-00', name: 'Monopio', allowsMovements: false },

  { code: '113-02-04-00', name: 'Seguros', allowsMovements: false },

  // Otras Cuentas por Cobrar a los Asociados (113.02.99.00)
  {
    code: '113-02-99-00',
    name: 'Otras cuentas por Cobrar a los Asociados',
    allowsMovements: false,
  },
  {
    code: '113-02-99-00',
    aux: '001',
    name: 'Ventas Utiles Escolares',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '002',
    name: 'Venta de JUGUETES',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '003',
    name: 'Ventas de CELULARES',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '004',
    name: 'Combos de Alimentos',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '005',
    name: 'Aceite Automovil',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '006',
    name: 'Venta de Electrodomesticos',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '007',
    name: 'Ctas x Cobrar Operadora TC',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '008',
    name: 'Provision Ctas Incobrables',
    allowsMovements: true,
  },
  {
    code: '113-02-99-00',
    aux: '009',
    name: 'CREDINOΜΙΝΑ',
    allowsMovements: true,
  },

  // Inventarios (114.xx.xx.xx)
  {
    code: '114-00-00-00',
    name: 'Inventario de Mercancias',
    allowsMovements: false,
  },

  // Equipos (114.01.xx.xx)
  {
    code: '114-01-00-00',
    name: 'Equipos Electrónicos',
    allowsMovements: false,
  },
  {
    code: '114-01-01-00',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  {
    code: '114-01-01-01',
    name: 'Computadoras Personales',
    allowsMovements: false,
  },
  {
    code: '114-01-01-02',
    name: 'Laptos, Mini Laptos y Tablet',
    allowsMovements: false,
  },
  {
    code: '114-01-01-99',
    name: 'Otros Equipos de Computacion y Accesorio',
    allowsMovements: false,
  },
  { code: '114-01-02-00', name: 'Linea Blanca', allowsMovements: false },
  { code: '114-01-03-00', name: 'Electrodomesticos', allowsMovements: false },

  // Telefonía (114.01.04.xx)
  {
    code: '114-01-04-00',
    name: 'Telefonos Celular y Fijo',
    allowsMovements: false,
  },
  {
    code: '114-01-04-00',
    aux: '001',
    name: 'Telefonía Celular y Fija',
    allowsMovements: true,
  },

  {
    code: '114-01-05-00',
    name: 'Herramientas Electronicas',
    allowsMovements: false,
  },

  // Otros Inventarios por Rubro (114.02.xx.xx, 114.03.xx.xx)
  { code: '114-02-00-00', name: 'Vestidos y Calzados', allowsMovements: false },
  {
    code: '114-03-00-00',
    name: 'Miscelaneos de Farmacia',
    allowsMovements: false,
  },
  {
    code: '114-04-00-00',
    name: 'Supermercado o Economato',
    allowsMovements: false,
  },

  // Otros Inventarios (114.99.00.00)
  { code: '114-99-00-00', name: 'Otros Inventarios', allowsMovements: false },
  {
    code: '114-99-00-00',
    aux: '001',
    name: 'Inventario CapreBicentenario',
    allowsMovements: true,
  },
  {
    code: '114-99-00-00',
    aux: '005',
    name: 'Inventario de JUGUETES',
    allowsMovements: true,
  },
  {
    code: '114-99-00-00',
    aux: '006',
    name: 'Articulos Escolares',
    allowsMovements: true,
  },
  {
    code: '114-99-00-00',
    aux: '007',
    name: 'Papeleria',
    allowsMovements: true,
  },
  {
    code: '114-99-00-00',
    aux: '008',
    name: 'Otros Suministro y Materiales Oficina',
    allowsMovements: true,
  },

  // Gastos Pagados por Anticipado (115.00.00.00)
  // Nota: Hay una cuenta 115.00.00.00 'Disponibilidad Restringida' en la imagen 1. Aquí se asume que 115.99.xx.xx es Gastos Pagados por Anticipado
  {
    code: '115-99-00-00',
    name: 'Gastos Pagados por Anticipado',
    allowsMovements: false,
  },
  {
    code: '115-99-01-00',
    name: 'Gastos Pagados por Anticipado',
    allowsMovements: false,
  }, // Repetido/detallado
  {
    code: '115-99-01-00',
    aux: '001',
    name: 'Seguros Pagados por Anticipado',
    allowsMovements: true,
  },

  // Otros Activos (115.xx.xx.xx, asumiendo 115 es Activos Corrientes diversos)
  {
    code: '115-01-00-00',
    name: 'Sobre Bienes Muebles',
    allowsMovements: false,
  },
  {
    code: '115-01-01-00',
    name: 'Sobre Bienes Muebles',
    allowsMovements: false,
  },
  {
    code: '115-01-02-00',
    name: 'Sobre Bienes Inmuebles',
    allowsMovements: false,
  },
  {
    code: '115-01-03-00',
    name: 'Fianzas de Fiel Cumplimiento',
    allowsMovements: false,
  },

  // Gastos Pagados por Anticipado (continuación 115.xx.xx.xx)

  // 115.01.99.00 (Otros Seguros Pagados por Anticipado)
  {
    code: '115-01-99-00',
    name: 'Otros Seguros Pagados por Anticipado',
    allowsMovements: false,
  },

  // 115.02.xx.xx (Otros Gastos Pagados por Anticipado)
  {
    code: '115-02-00-00',
    name: 'Alquileres Pagados por Anticipado',
    allowsMovements: false,
  },

  // 115.02.01.xx (Sobre Bienes Muebles / Inmuebles)
  {
    code: '115-02-01-00',
    name: 'Sobre Bienes Muebles',
    allowsMovements: false,
  },
  {
    code: '115-02-02-00',
    name: 'Sobre Bienes Inmuebles',
    allowsMovements: false,
  },
  {
    code: '115-02-02-00',
    aux: '001',
    name: 'Sobre Bienes Inmuebles Las Islas del Sol',
    allowsMovements: true,
  },
  {
    code: '115-02-02-00',
    aux: '002',
    name: 'Sobre Bienes Inmuebles Los Olas Resort',
    allowsMovements: true,
  },
  {
    code: '115-02-02-00',
    aux: '003',
    name: 'Sobre Bienes Inmuebles Coral Suites',
    allowsMovements: true,
  },

  // 115.99.xx.xx (Otros Gastos Pagados por Anticipado)
  {
    code: '115-99-00-00',
    name: 'Otros Gastos Pagados por Anticipado',
    allowsMovements: false,
  },
  {
    code: '115-99-00-00',
    aux: '003',
    name: 'Otros Gastos Pagados por Anticipado',
    allowsMovements: true,
  },

  // Cartera de Préstamos (120.00.00.00)
  {
    code: '120-00-00-00',
    name: 'Cartera de Prestamos',
    allowsMovements: false,
  },

  // Préstamos con Garantías de Haberes (121.00.00.00)
  {
    code: '121-00-00-00',
    name: 'Prestamos con Garantias de Haberes',
    allowsMovements: false,
  },

  // Préstamos a Corto Plazo (121.01.xx.xx)
  { code: '121-01-00-00', name: 'Corto Plazo', allowsMovements: false },
  {
    code: '121-01-00-00',
    aux: '001',
    name: 'Prestamo Corto Plazo',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '002',
    name: 'PRESTAMO AFIANZADOS',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '003',
    name: 'Polizas de Seguro',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '004',
    name: 'Productos Navideños',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '005',
    name: 'PRESTAMO DEPARTAMENTO COMERCIAL',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '006',
    name: 'CREDIBALARIO',
    allowsMovements: true,
  },
  {
    code: '121-01-00-00',
    aux: '007',
    name: 'JORNADA de SALUD',
    allowsMovements: true,
  },

  // Préstamos a Mediano Plazo (121.02.xx.xx)
  { code: '121-02-00-00', name: 'Mediano Plazo', allowsMovements: false },
  {
    code: '121-02-00-00',
    aux: '001',
    name: 'Prestamo Mediano Plazo',
    allowsMovements: true,
  },
  {
    code: '121-02-00-00',
    aux: '002',
    name: 'Afianzados 36 Meses 3 %',
    allowsMovements: true,
  },

  // Préstamos a Largo Plazo (121.03.xx.xx)
  { code: '121-03-00-00', name: 'Largo Plazo', allowsMovements: false },
  {
    code: '121-03-00-00',
    aux: '001',
    name: 'Prestamos Largo Plazo',
    allowsMovements: true,
  },
  {
    code: '121-03-00-00',
    aux: '002',
    name: 'Afianzados 48 Meses 3.5 %',
    allowsMovements: true,
  },
  {
    code: '121-03-00-00',
    aux: '003',
    name: 'Cuota Especial Largo Plazo',
    allowsMovements: true,
  },

  // Préstamos con Garantía de Haberes Disponible (122.00.00.00)
  {
    code: '122-00-00-00',
    name: 'Prestamos con Garantias de Haberes Dispo',
    allowsMovements: false,
  },

  // Corto Plazo con Fianza (122.01.xx.xx)
  {
    code: '122-01-00-00',
    name: 'CORTO PLAZO CON FIANZA',
    allowsMovements: false,
  },
  {
    code: '122-01-00-00',
    aux: '001',
    name: 'Prestamo Corto con Fianza',
    allowsMovements: true,
  },

  // Mediano Plazo con Fianza (122.02.xx.xx)
  { code: '122-02-00-00', name: 'Mediano Plazo', allowsMovements: false },
  {
    code: '122-02-00-00',
    aux: '001',
    name: 'Prestamo Afianzados MEDIANO PLAZO',
    allowsMovements: true,
  },

  // Largo Plazo con Fianza (122.03.xx.xx)
  { code: '122-03-00-00', name: 'Largo Plazo', allowsMovements: false },
  {
    code: '122-03-00-00',
    aux: '001',
    name: 'Prestamos Afianzados LARGO PLAZO',
    allowsMovements: true,
  },

  // Préstamos con Reserva de Dominio (123.00.00.00)
  {
    code: '123-00-00-00',
    name: 'Prestamos con Reserva de Dominio',
    allowsMovements: false,
  },

  // Vehículos (123.01.xx.xx)
  { code: '123-01-00-00', name: 'Vehiculos', allowsMovements: false },
  {
    code: '123-01-00-00',
    aux: '001',
    name: 'Vehiculos',
    allowsMovements: true,
  },
  {
    code: '123-01-00-00',
    aux: '002',
    name: 'CREDITOS MOTO',
    allowsMovements: true,
  },
  {
    code: '123-01-00-00',
    aux: '003',
    name: 'Vehiculos Usados',
    allowsMovements: true,
  },

  // Crédito Moto (123.03.xx.xx)
  { code: '123-03-00-00', name: 'CREDITO MOTO', allowsMovements: false },
  {
    code: '123-03-00-00',
    aux: '001',
    name: 'CREDITO MOTO',
    allowsMovements: true,
  }, // Asumiendo que 123-03-00-00 aux 001 es la cuenta de movimiento

  // Préstamos con Garantías Hipotecarias (124.00.00.00)
  {
    code: '124-00-00-00',
    name: 'Prestamos con Garantias Hipotecarias',
    allowsMovements: false,
  },

  // Adquisición (124.01.xx.xx)
  { code: '124-01-00-00', name: 'Adquisición', allowsMovements: false },
  {
    code: '124-01-00-00',
    aux: '001',
    name: 'PRESTAMOS HIPOTECARIOS',
    allowsMovements: true,
  },
  {
    code: '124-01-00-00',
    aux: '002',
    name: 'Hipotecarios Remodelacion',
    allowsMovements: true,
  },

  // Construcción (124.02.xx.xx)
  { code: '124-02-00-00', name: 'Construcción', allowsMovements: false },

  // Terminación (124.03.xx.xx)
  { code: '124-03-00-00', name: 'Terminación', allowsMovements: false },

  // Ampliación (124.04.xx.xx)
  { code: '124-04-00-00', name: 'Ampliación', allowsMovements: false },

  // Remodelación (124.05.xx.xx)
  { code: '124-05-00-00', name: 'Remodelación', allowsMovements: false },

  // Liberación de Hipoteca (124.06.xx.xx)
  {
    code: '124-06-00-00',
    name: 'Liberación de Hipoteca',
    allowsMovements: false,
  },

  // Préstamos Otorgados (EX Asociados) (125.00.00.00)
  {
    code: '125-00-00-00',
    name: 'Prestamos Otorgados (EX Asociados)',
    allowsMovements: false,
  },

  // Préstamos Otorgados (EX Asociados) (125.xx.xx.xx - continuación de Imagen 3)
  {
    code: '125-01-00-00',
    name: 'Préstamos con Reserva de Dominio',
    allowsMovements: false,
  },

  // Préstamos con Garantías Hipotecarias
  {
    code: '125-02-00-00',
    name: 'Préstamos con Garantias Hipotecarias',
    allowsMovements: false,
  },
  { code: '125-02-01-00', name: 'Adquisición', allowsMovements: false },
  { code: '125-02-02-00', name: 'Construcción', allowsMovements: false },
  { code: '125-02-03-00', name: 'Terminación', allowsMovements: false },
  { code: '125-02-04-00', name: 'Ampliación', allowsMovements: false },
  { code: '125-02-05-00', name: 'Remodelación', allowsMovements: false },
  {
    code: '125-02-06-00',
    name: 'Liberación de hipoteca',
    allowsMovements: false,
  },

  // Préstamos Vencidos (126.xx.xx.xx)
  { code: '126-00-00-00', name: 'Prestamos Vencidos', allowsMovements: false },
  {
    code: '126-01-00-00',
    name: 'Préstamos con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '126-02-00-00',
    name: 'Préstamos con Garantias Hipotecarias',
    allowsMovements: false,
  },
  { code: '126-02-01-00', name: 'Adquisición', allowsMovements: false },
  { code: '126-02-02-00', name: 'Construcción', allowsMovements: false },
  { code: '126-02-03-00', name: 'Terminación', allowsMovements: false },
  { code: '126-02-04-00', name: 'Ampliación', allowsMovements: false },
  { code: '126-02-05-00', name: 'Remodelación', allowsMovements: false },
  {
    code: '126-02-06-00',
    name: 'Liberación de hipoteca',
    allowsMovements: false,
  },

  // Préstamos en Litigio (127.xx.xx.xx)
  {
    code: '127-00-00-00',
    name: 'Préstamos en Litigio',
    allowsMovements: false,
  },
  {
    code: '127-01-00-00',
    name: 'Con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '127-02-00-00',
    name: 'Con Garantias Hipotecarias',
    allowsMovements: false,
  },
  { code: '127-02-01-00', name: 'Adquisición', allowsMovements: false },
  { code: '127-02-02-00', name: 'Construcción', allowsMovements: false },
  { code: '127-02-03-00', name: 'Terminación', allowsMovements: false },
  { code: '127-02-04-00', name: 'Ampliación', allowsMovements: false },
  { code: '127-02-05-00', name: 'Remodelación', allowsMovements: false },
  {
    code: '127-02-06-00',
    name: 'Liberación de hipoteca',
    allowsMovements: false,
  },

  // Estimación para Cartera de Préstamos (128.00.00.00)
  {
    code: '128-00-00-00',
    name: '(Estimación para Cartera de Prestamos)',
    allowsMovements: false,
  },
  {
    code: '128-01-00-00',
    name: '(Estimación para Préstamos con Garantía',
    allowsMovements: false,
  },

  // Prestamos (Auxiliares agrupados) (129.xx.xx.xx)
  {
    code: '129-01-00-00',
    name: 'PRESTAMOS PERSONALES',
    allowsMovements: false,
  },
  {
    code: '129-01-00-00',
    aux: '010',
    name: 'PRESTAMOS PERSONALES',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '011',
    name: 'PRESTAMOS HIPOTECARIOS',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '012',
    name: 'CREDITOS MOTO',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '013',
    name: 'Prestamos Afianzados',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '014',
    name: 'CREDITOS DE VEHICULOS',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '015',
    name: 'PRESTAMOS MEDIANO PLAZO',
    allowsMovements: true,
  },
  {
    code: '129-01-00-00',
    aux: '016',
    name: 'PRESTAMOS LARGO PLAZO',
    allowsMovements: true,
  },

  // Estimaciones (continuación)
  {
    code: '129-02-00-00',
    name: '(Estimación para Prestamos con Reserva d',
    allowsMovements: false,
  },
  {
    code: '129-03-00-00',
    name: '(Estimación para Préstamos con Garantias',
    allowsMovements: false,
  },

  // Cartera de Inversiones (130.00.00.00)
  {
    code: '130-00-00-00',
    name: 'Cartera de Inversiones',
    allowsMovements: false,
  },

  // Inversiones Disponibles Para La Venta (131.xx.xx.xx)
  {
    code: '131-00-00-00',
    name: 'Inversiones Disponibles Para La Venta',
    allowsMovements: false,
  },
  {
    code: '131-01-00-00',
    name: 'Bonos y Obligaciones de la Deuda Pública',
    allowsMovements: false,
  },
  {
    code: '131-02-00-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '131-03-00-00',
    name: 'Bonos y Obligaciones Emitidas por el Ban',
    allowsMovements: false,
  },
  {
    code: '131-04-00-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '131-09-00-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  },
  {
    code: '131-99-00-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  },

  // Inversiones Mantenidas Hasta su Vencimiento (132.xx.xx.xx)
  {
    code: '132-00-00-00',
    name: 'Inversiones Mantenidas Hasta su Vencimie',
    allowsMovements: false,
  },
  {
    code: '132-01-00-00',
    name: 'Bonos y Obligaciones de la Deuda Pública',
    allowsMovements: false,
  },
  {
    code: '132-02-00-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '132-03-00-00',
    name: 'Bonos y Obligaciones Emitidas por el Ban',
    allowsMovements: false,
  },
  {
    code: '132-04-00-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '132-05-00-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },

  // Inversiones Mantenidas Hasta su Vencimiento (132.xx.xx.xx - continuación)
  {
    code: '132-99-00-00',
    name: 'Otras Inversiones en Títulos Valores',
    allowsMovements: false,
  },

  // Inversiones En Relacionadas (133.00.00.00)
  {
    code: '133-00-00-00',
    name: 'Inversiones En Relacionadas',
    allowsMovements: false,
  },
  {
    code: '133-01-00-00',
    name: 'Inversiones en Asociadas',
    allowsMovements: false,
  },
  { code: '133-02-00-00', name: 'Otras Inversiones', allowsMovements: false },

  // Colocaciones Financieras (134.xx.xx.xx)
  {
    code: '134-01-00-00',
    name: 'Colocaciones Financieras (Mayor a Novent',
    allowsMovements: false,
  },
  {
    code: '134-01-99-00',
    name: 'Otras Colocaciones Financieras',
    allowsMovements: false,
  },

  // Inversiones Restringidas (134.02.xx.xx)
  {
    code: '134-02-00-00',
    name: 'Otras Inversiones Restringidas',
    allowsMovements: false,
  },
  {
    code: '134-02-01-00',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  { code: '134-02-02-00', name: 'Reservas Especiales', allowsMovements: false },
  { code: '134-02-03-00', name: 'Otras Reservas', allowsMovements: false },

  // Otras Inversiones (134.99.xx.xx)
  {
    code: '134-99-00-00',
    name: 'Otras Inversiones (Mayor a Noventa y un',
    allowsMovements: false,
  },

  // Títulos Valores No Negociables (135.xx.xx.xx)
  {
    code: '135-00-00-00',
    name: 'Títulos Valores No Negociables',
    allowsMovements: false,
  },
  {
    code: '135-01-00-00',
    name: 'Bonos y Obligaciones de la Deuda Publica',
    allowsMovements: false,
  },
  {
    code: '135-02-00-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '135-03-00-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '135-04-00-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  },
  {
    code: '135-05-00-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  }, // Repetido en la imagen
  {
    code: '135-99-00-00',
    name: 'Otras Inversiones en Títulos Valores',
    allowsMovements: false,
  },

  // Inversiones Vencidas (136.xx.xx.xx)
  {
    code: '136-00-00-00',
    name: 'Inversiones Vencidas',
    allowsMovements: false,
  },
  {
    code: '136-01-00-00',
    name: 'Mantenidas Hasta su Vencimiento',
    allowsMovements: false,
  },
  { code: '136-01-01-00', name: 'Capitales', allowsMovements: false },
  { code: '136-01-02-00', name: 'Intereses', allowsMovements: false },
  { code: '136-02-00-00', name: 'Otras Inversiones', allowsMovements: false },
  { code: '136-02-01-00', name: 'Capitales', allowsMovements: false },
  { code: '136-02-02-00', name: 'Intereses', allowsMovements: false },

  // Inversiones en Litigio (137.xx.xx.xx)
  {
    code: '137-00-00-00',
    name: 'Inversiones en Litigio',
    allowsMovements: false,
  },
  { code: '137-01-00-00', name: 'Capitales', allowsMovements: false },
  { code: '137-02-00-00', name: 'Intereses', allowsMovements: false },
  { code: '137-03-00-00', name: 'Otras Inversiones', allowsMovements: false },
  { code: '137-03-01-00', name: 'Capitales', allowsMovements: false },
  { code: '137-03-02-00', name: 'Intereses', allowsMovements: false },

  // Inversiones Temporales y Permanentes (Activos Fijos) (138.xx.xx.xx)
  {
    code: '138-00-00-00',
    name: 'Inversiones Temporales y Permanentes',
    allowsMovements: false,
  },

  // Inmuebles en Construccion Temporales (138.01.xx.xx)
  {
    code: '138-01-00-00',
    name: 'Inmuebles en Construccion Temporales',
    allowsMovements: false,
  },
  { code: '138-02-00-00', name: 'Terreno', allowsMovements: false },
  { code: '138-02-01-00', name: 'Terreno', allowsMovements: false },
  { code: '138-02-02-00', name: 'Otros Inmuebles', allowsMovements: false },

  // Inmuebles Terminados Temporales (138.03.xx.xx)
  { code: '138-03-00-00', name: 'Terreno', allowsMovements: false }, // Nota: Este código parece ser Terreno del grupo 138.03.xx.xx en la imagen
  { code: '138-03-01-00', name: 'Habitacionales', allowsMovements: false },
  { code: '138-03-02-00', name: 'Turísticas', allowsMovements: false },
  { code: '138-03-03-00', name: 'Servicios', allowsMovements: false },

  // Mejoras y Terrenos Permanentes (138.04.xx.xx, 138.05.xx.xx)
  {
    code: '138-04-00-00',
    name: 'Inmuebles Terminados Temporales',
    allowsMovements: false,
  },
  { code: '138-04-01-00', name: 'Habitacionales', allowsMovements: false },
  { code: '138-04-02-00', name: 'Mejoras', allowsMovements: false },
  { code: '138-04-02-01', name: 'Mejoras', allowsMovements: false },
  { code: '138-04-02-02', name: 'Mejoras', allowsMovements: false },
  {
    code: '138-05-00-00',
    name: 'Inmuebles Terminados Permanentes',
    allowsMovements: false,
  },

  // Inmuebles Terminados Permanentes (138.05.xx.xx - continuación de Imagen 5)
  { code: '138-05-01-00', name: 'Turísticas', allowsMovements: false },
  { code: '138-05-01-01', name: 'Terreno', allowsMovements: false },
  {
    code: '138-05-01-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '138-05-01-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '138-05-01-04', name: 'Vehículos', allowsMovements: false },
  { code: '138-05-01-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '138-05-01-06', name: 'Mejoras', allowsMovements: false },

  // Servicios (138.05.02.xx)
  { code: '138-05-02-00', name: 'Servicios', allowsMovements: false },
  { code: '138-05-02-01', name: 'Terreno', allowsMovements: false },
  {
    code: '138-05-02-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '138-05-02-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '138-05-02-04', name: 'Vehículos', allowsMovements: false },
  { code: '138-05-02-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '138-05-02-06', name: 'Mejoras', allowsMovements: false },

  // Depreciación Acumulada (138.98.xx.xx)
  {
    code: '138-98-00-00',
    name: 'Depreciacion Acumulada Para Bienes de In',
    allowsMovements: false,
  },
  { code: '138-98-01-00', name: 'Turísticas', allowsMovements: false },
  { code: '138-98-01-01', name: 'Edificaciones', allowsMovements: false },
  {
    code: '138-98-01-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '138-98-01-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '138-98-01-04', name: 'Vehículos', allowsMovements: false },
  { code: '138-98-01-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '138-98-01-06', name: 'Mejoras', allowsMovements: false },

  // Depreciación Servicios (138.98.02.xx)
  { code: '138-98-02-00', name: 'Servicios', allowsMovements: false },
  { code: '138-98-02-01', name: 'Edificaciones', allowsMovements: false },
  {
    code: '138-98-02-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '138-98-02-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '138-98-02-04', name: 'Vehículos', allowsMovements: false },
  { code: '138-98-02-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '138-98-02-06', name: 'MEJORAS', allowsMovements: false },

  // Estimaciones (139.xx.xx.xx)
  {
    code: '139-00-00-00',
    name: '(Estimación para Cartera de Inversión)',
    allowsMovements: false,
  },
  {
    code: '139-01-00-00',
    name: '(Estimación para Inversiones Títulos Val',
    allowsMovements: false,
  },
  {
    code: '139-01-01-00',
    name: '(Estimación para Inversiones Vencidas)',
    allowsMovements: false,
  },
  {
    code: '139-02-00-00',
    name: '(Estimación para Inversiones Vencidas)',
    allowsMovements: false,
  }, // Repetido en la imagen
  {
    code: '139-03-00-00',
    name: '(Estimación de Capitales Para Inversione',
    allowsMovements: false,
  },
  {
    code: '139-03-01-00',
    name: '(Estimación para Inmuebles en Construcc',
    allowsMovements: false,
  },
  {
    code: '139-03-02-00',
    name: '(Estimación para Inmuebles en Construcc',
    allowsMovements: false,
  },
  {
    code: '139-03-99-00',
    name: '(Estimación para Otras Inversiones)',
    allowsMovements: false,
  },

  // Intereses por Cobrar (140.00.00.00)
  {
    code: '140-00-00-00',
    name: 'Intereses por Cobrar',
    allowsMovements: false,
  },

  // Rendimientos en Bancos e Instituciones Financieras (141.xx.xx.xx)
  {
    code: '141-00-00-00',
    name: 'Rendimientos en Bancos e Instituciones F',
    allowsMovements: false,
  },

  // Sector Público (141.01.xx.xx)
  { code: '141-01-00-00', name: 'Moneda Nacional', allowsMovements: false },
  { code: '141-01-01-00', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '141-01-01-01', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '141-01-01-02',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '141-01-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Moneda Extranjera (141.01.02.xx)
  { code: '141-01-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  { code: '141-01-02-01', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '141-01-02-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '141-01-02-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '141-01-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Sector Privado (141.02.xx.xx)
  { code: '141-02-00-00', name: 'Sector Privado', allowsMovements: false },

  // Sector Privado (141.02.xx.xx)
  { code: '141-02-01-00', name: 'Moneda Nacional', allowsMovements: false },
  { code: '141-02-01-01', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '141-02-01-02', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '141-02-01-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '141-02-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Sector Privado Moneda Extranjera (141.02.02.xx)
  { code: '141-02-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  { code: '141-02-02-01', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '141-02-02-02',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '141-02-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Rendimiento por Disponibilidad Restringida (141.03.xx.xx)
  {
    code: '141-03-00-00',
    name: 'Rendimiento por Disponibilidad Restringi',
    allowsMovements: false,
  },

  // Sector Público Restringido (141.03.01.xx)
  { code: '141-03-01-00', name: 'Sector Público', allowsMovements: false },
  {
    code: '141-03-01-01',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  { code: '141-03-01-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '141-03-01-99', name: 'Otras Reservas', allowsMovements: false },

  // Sector Privado Restringido (141.03.02.xx)
  { code: '141-03-02-00', name: 'Sector Privado', allowsMovements: false },
  {
    code: '141-03-02-01',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  { code: '141-03-02-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '141-03-02-99', name: 'Otras Reservas', allowsMovements: false },

  // Intereses por Cobrar (142.xx.xx.xx)
  {
    code: '142-00-00-00',
    name: 'Intereses por Cobrar Por Cartera de Pres',
    allowsMovements: false,
  },
  {
    code: '142-01-00-00',
    name: 'Intereses por Cobrar por Préstamos con G',
    allowsMovements: false,
  },
  { code: '142-01-01-00', name: 'Corto Plazo', allowsMovements: false },
  { code: '142-01-02-00', name: 'Mediano Plazo', allowsMovements: false },
  { code: '142-01-03-00', name: 'Largo Plazo', allowsMovements: false },

  // Intereses por Préstamos con Reserva de Dominio (142.02.xx.xx)
  {
    code: '142-02-00-00',
    name: 'Intereses por Cobrar por Préstamos con R',
    allowsMovements: false,
  },

  // Intereses por Préstamos con Garantías Hipotecarias (142.03.xx.xx)
  {
    code: '142-03-00-00',
    name: 'Intereses por Cobrar por Préstamos con G',
    allowsMovements: false,
  },
  { code: '142-03-01-00', name: 'Adquisición', allowsMovements: false },
  { code: '142-03-02-00', name: 'Construcción', allowsMovements: false },
  { code: '142-03-03-00', name: 'Terminación', allowsMovements: false },
  { code: '142-03-04-00', name: 'Ampliación', allowsMovements: false },
  { code: '142-03-05-00', name: 'Remodelación', allowsMovements: false },
  {
    code: '142-03-06-00',
    name: 'Liberación de hipoteca',
    allowsMovements: false,
  },

  // Intereses por Préstamos Otorgados (EX Asociados) (142.04.xx.xx)
  {
    code: '142-04-00-00',
    name: 'Intereses por Cobrar por Préstamos Otorg',
    allowsMovements: false,
  },
  {
    code: '142-04-01-00',
    name: 'Préstamos con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '142-04-02-00',
    name: 'Con Garantias Hipotecarias',
    allowsMovements: false,
  },
  { code: '142-04-02-01', name: 'Adquisición', allowsMovements: false },
  { code: '142-04-02-02', name: 'Construcción', allowsMovements: false },
  { code: '142-04-02-03', name: 'Terminación', allowsMovements: false },
  { code: '142-04-02-04', name: 'Ampliación', allowsMovements: false },
  { code: '142-04-02-05', name: 'Remodelación', allowsMovements: false },
  {
    code: '142-04-02-06',
    name: 'Liberación de Hipoteca',
    allowsMovements: false,
  },

  // Intereses por Préstamos Vencidos (142.05.xx.xx)
  {
    code: '142-05-00-00',
    name: 'Intereses por Cobrar Préstamos Venci',
    allowsMovements: false,
  },
  {
    code: '142-05-01-00',
    name: 'Con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '142-05-02-00',
    name: 'Con Garantias Hipotecarias',
    allowsMovements: false,
  },
  { code: '142-05-02-01', name: 'Adquisición', allowsMovements: false },
  { code: '142-05-02-02', name: 'Construcción', allowsMovements: false },
  { code: '142-05-02-03', name: 'Terminación', allowsMovements: false },
  { code: '142-05-02-04', name: 'Ampliación', allowsMovements: false },
  { code: '142-05-02-05', name: 'Remodelación', allowsMovements: false },
  {
    code: '142-05-02-06',
    name: 'Liberación de Hipoteca',
    allowsMovements: false,
  },

  // Intereses por Cobrar Préstamos en Litigio (142.06.xx.xx)
  {
    code: '142-06-00-00',
    name: 'Intereses por Cobrar Prestamos en Litigio',
    allowsMovements: false,
  },
  {
    code: '142-06-01-00',
    name: 'Intereses por Cobrar Por Prestamos Venci',
    allowsMovements: false,
  }, // Nota: El nombre en la imagen parece estar truncado o mal clasificado.
  { code: '142-06-01-01', name: 'Reserva de Dominio', allowsMovements: false },
  {
    code: '142-06-02-00',
    name: 'Garantía Hipotecaria',
    allowsMovements: false,
  },

  // Intereses por Cobrar Préstamos Otorgados (142.06.02.xx - Reutilización de rubros)
  {
    code: '142-06-02-01',
    name: 'Intereses por Cobrar con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '142-06-02-02',
    name: 'Garantía Hipotecaria',
    allowsMovements: false,
  },
  { code: '142-06-02-03', name: 'Adquisicion', allowsMovements: false },
  { code: '142-06-02-04', name: 'Construccion', allowsMovements: false },
  { code: '142-06-02-05', name: 'Terminacion', allowsMovements: false },
  { code: '142-06-02-06', name: 'Ampliacion', allowsMovements: false },
  { code: '142-06-02-07', name: 'Remodelacion', allowsMovements: false },
  {
    code: '142-06-02-08',
    name: 'Liberacion de Hipoteca',
    allowsMovements: false,
  },

  // Rendimientos sobre Cartera de Inversiones (143.xx.xx.xx)
  {
    code: '143-00-00-00',
    name: 'Rendimientos sobre Cartera de Inversiones',
    allowsMovements: false,
  },
  {
    code: '143-01-00-00',
    name: 'Rendimientos en Inversiones Disponibles',
    allowsMovements: false,
  },
  {
    code: '143-01-01-00',
    name: 'Bonos y Obligaciones de la Deuda Pública',
    allowsMovements: false,
  },
  {
    code: '143-01-02-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '143-01-03-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '143-01-04-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '143-01-05-00',
    name: 'Bonos y Obligaciones Emitidas por Empresas',
    allowsMovements: false,
  },
  {
    code: '143-01-99-00',
    name: 'Otras Inversiones en Títulos Valores',
    allowsMovements: false,
  },

  // Rendimientos en Inversiones Mantenidas H (143.02.xx.xx)
  {
    code: '143-02-00-00',
    name: 'Rendimientos en Inversiones Mantenidas H',
    allowsMovements: false,
  },
  {
    code: '143-02-01-00',
    name: 'Bonos y Obligaciones de la Deuda Pública',
    allowsMovements: false,
  },
  {
    code: '143-02-02-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '143-02-03-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '143-02-04-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '143-02-05-00',
    name: 'Bonos y Obligaciones Emitidas por Empresas',
    allowsMovements: false,
  },
  {
    code: '143-02-99-00',
    name: 'Otras Inversiones en Títulos Valores',
    allowsMovements: false,
  },

  // Rendimientos en Otras Inversiones (143.03.xx.xx)
  {
    code: '143-03-00-00',
    name: 'Rendimientos en Otras Inversiones',
    allowsMovements: false,
  },
  {
    code: '143-03-01-00',
    name: 'Colocaciones Financieras (Mayor a Novent',
    allowsMovements: false,
  },
  {
    code: '143-03-02-00',
    name: 'Inversiones Restringidas',
    allowsMovements: false,
  },
  {
    code: '143-03-03-00',
    name: 'Otras Operaciones (Mayor a Noventa y un',
    allowsMovements: false,
  },

  // Otros Intereses por Cobrar (144.xx.xx.xx)
  {
    code: '144-00-00-00',
    name: 'Otros Intereses por Cobrar',
    allowsMovements: false,
  },

  // Estimaciones para Intereses (149.xx.xx.xx)
  {
    code: '149-00-00-00',
    name: 'Intereses por Incumplimiento de Pago del',
    allowsMovements: false,
  },
  {
    code: '149-01-00-00',
    name: '(Estimación para Intereses por Cobrar)',
    allowsMovements: false,
  },
  {
    code: '149-02-00-00',
    name: '(Estimación para Rendimientos sobre Cart',
    allowsMovements: false,
  },

  // Bienes Recuperados (150.xx.xx.xx)
  { code: '150-00-00-00', name: 'Bienes Recuperados', allowsMovements: false },
  {
    code: '151-00-00-00',
    name: 'Bienes Muebles recuperados',
    allowsMovements: false,
  },
  {
    code: '151-01-00-00',
    name: 'Bienes Muebles recuperados',
    allowsMovements: false,
  },
  {
    code: '151-02-00-00',
    name: 'Bienes Inmuebles recuperados',
    allowsMovements: false,
  },
  {
    code: '151-02-01-00',
    name: 'Bienes Inmuebles Terminados',
    allowsMovements: false,
  },
  {
    code: '151-02-02-00',
    name: 'Bienes Inmuebles en Construccion',
    allowsMovements: false,
  },

  // Activo Fijo (170.xx.xx.xx)
  { code: '170-00-00-00', name: 'Activo Fijo', allowsMovements: false },
  { code: '171-00-00-00', name: 'Terrenos', allowsMovements: false },
  { code: '171-01-00-00', name: 'Terrenos', allowsMovements: false },

  // Edificaciones (172.xx.xx.xx)
  { code: '172-00-00-00', name: 'Edificaciones', allowsMovements: false },
  {
    code: '172-01-00-00',
    name: 'Activos Fijos EDIFICIO',
    allowsMovements: false,
  },
  {
    code: '172-01-01-00',
    name: 'Costo de Adquisicion',
    allowsMovements: false,
  },
  {
    code: '172-01-01-00',
    aux: '001',
    name: 'Costo de Adquisicion',
    allowsMovements: true,
  },

  // Edificaciones (172.xx.xx.xx - continuación)
  {
    code: '172-01-01-00',
    aux: '001',
    name: 'COSTO DE ADQUISICION',
    allowsMovements: true,
  },
  { code: '172-01-02-00', name: 'Mejoras', allowsMovements: false },
  { code: '172-01-02-00', aux: '001', name: 'Mejoras', allowsMovements: true },
  {
    code: '172-01-02-00',
    aux: '004',
    name: 'Mejoras SEDE CAPREBICENTENARIO',
    allowsMovements: true,
  },

  // Depreciación Edificaciones (172.98.xx.xx)
  {
    code: '172-98-00-00',
    name: '(Depreciacion Acumulada Edificaciones)',
    allowsMovements: false,
  },
  {
    code: '172-98-01-00',
    name: '(Depreciacion Acumulada Edificaciones)',
    allowsMovements: false,
  },
  {
    code: '172-98-01-00',
    aux: '001',
    name: '(Depreciacion Acumulada Edificaciones)',
    allowsMovements: true,
  },
  {
    code: '172-98-01-00',
    aux: '003',
    name: '(Deprec. Acumulada MEJORAS BELLO CAMPO)',
    allowsMovements: true,
  },
  {
    code: '172-98-02-00',
    name: '(Depreciacion Acumulada MEJORAS Edificios)',
    allowsMovements: false,
  },
  {
    code: '172-98-02-00',
    aux: '001',
    name: '(Depreciacion Acumulada MEJORAS Edificios)',
    allowsMovements: true,
  },
  {
    code: '172-98-02-00',
    aux: '004',
    name: '(Deprec. Acumul. Mejora Sede BELLO CAMPO)',
    allowsMovements: true,
  },

  // Mobiliario y Equipos (173.xx.xx.xx)
  {
    code: '173-00-00-00',
    name: 'Mobiliario Y Equipos',
    allowsMovements: false,
  },
  {
    code: '173-01-00-00',
    name: 'Mobiliario de Oficina',
    allowsMovements: false,
  },
  {
    code: '173-01-00-00',
    aux: '001',
    name: 'Mobiliario de Oficina',
    allowsMovements: true,
  },
  { code: '173-02-00-00', name: 'Equipos de Oficina', allowsMovements: false },
  {
    code: '173-02-00-00',
    aux: '001',
    name: 'Equipos de Oficina',
    allowsMovements: true,
  },
  {
    code: '173-03-00-00',
    name: 'Equipos de Seguridad',
    allowsMovements: false,
  },
  {
    code: '173-03-00-00',
    aux: '001',
    name: 'Equipos de Seguridad',
    allowsMovements: true,
  },
  {
    code: '173-04-00-00',
    name: 'Equipos de Computación',
    allowsMovements: false,
  },
  {
    code: '173-04-00-00',
    aux: '001',
    name: 'Equipos de Computacion',
    allowsMovements: true,
  },

  // Depreciación Mobiliario y Equipos (173.98.xx.xx)
  {
    code: '173-98-00-00',
    name: '(Depreciación Acumulada de Mobiliario y',
    allowsMovements: false,
  },
  {
    code: '173-98-01-00',
    name: '(Depreciación Acumulada de Mobiliario y',
    allowsMovements: false,
  },
  {
    code: '173-98-01-00',
    aux: '001',
    name: '(Depreciacion Acumulada de MOBILIARIO de OFICINA)',
    allowsMovements: true,
  },
  {
    code: '173-98-02-00',
    name: '(Depreciación Acumulada de Equipo de Ofi',
    allowsMovements: false,
  },
  {
    code: '173-98-02-00',
    aux: '001',
    name: '(Deprec. Acumul. EQUIPOS de OFICINA)',
    allowsMovements: true,
  },
  {
    code: '173-98-03-00',
    name: '(Depreciación Acumulada de Equipo de Seg',
    allowsMovements: false,
  },
  {
    code: '173-98-03-00',
    aux: '001',
    name: '(Depreciación Acumulada de Equipo de Seg',
    allowsMovements: true,
  },
  {
    code: '173-98-04-00',
    name: '(Depreciación Acumulada de Equipos de Com',
    allowsMovements: false,
  },
  {
    code: '173-98-04-00',
    aux: '004',
    name: '(Deprec. Acumul. EQUIPOS de COMPUTACION',
    allowsMovements: true,
  },
  {
    code: '173-98-99-00',
    name: '(Depreciación Acumulada de Otros Equipos',
    allowsMovements: false,
  },

  // Equipos de Transporte (174.xx.xx.xx)
  { code: '174-00-00-00', name: 'Otros Equipos', allowsMovements: false },
  {
    code: '174-01-00-00',
    name: 'Equipos de Transporte',
    allowsMovements: false,
  },
  {
    code: '174-01-00-00',
    aux: '001',
    name: 'Vehículos',
    allowsMovements: true,
  },

  // Depreciación Equipo de Transporte (174.98.xx.xx)
  {
    code: '174-98-00-00',
    name: '(Depreciación Acumulada de Equipos de Tr',
    allowsMovements: false,
  },
  {
    code: '174-98-01-00',
    name: '(Depreciación Acumulada Vehículos)',
    allowsMovements: false,
  },
  {
    code: '174-98-01-00',
    aux: '001',
    name: '(Depreciación Acumulada Vehículos)',
    allowsMovements: true,
  },
  {
    code: '174-98-99-00',
    name: '(Depreciación Acumulada Otros Equipos de',
    allowsMovements: false,
  },
  {
    code: '174-99-00-00',
    name: 'Otros Equipos de Transporte',
    allowsMovements: false,
  },

  // Otros Bienes (175.xx.xx.xx)
  { code: '175-00-00-00', name: 'Otros Bienes', allowsMovements: false },
  { code: '175-01-00-00', name: 'Obras de Arte', allowsMovements: false },
  { code: '175-02-00-00', name: 'Biblioteca', allowsMovements: false },
  { code: '175-99-00-00', name: 'Otros Bienes de Uso', allowsMovements: false },

  // Otros Activos (180.xx.xx.xx)
  { code: '180-00-00-00', name: 'Otros Activos', allowsMovements: false },

  // Cargos Diferidos (181.xx.xx.xx)
  { code: '181-01-00-00', name: 'Cargos Diferidos', allowsMovements: false },

  // Adquisición de Software (181.02.xx.xx)
  {
    code: '181-02-00-00',
    name: 'Adquisición de Software',
    allowsMovements: false,
  },
  {
    code: '181-02-01-00',
    name: 'Adquisicion de Software',
    allowsMovements: false,
  },
  {
    code: '181-02-01-00',
    aux: '001',
    name: 'Licencias (Software)',
    allowsMovements: true,
  },

  // Otros Gastos Diferidos (181.05.xx.xx)
  {
    code: '181-05-00-00',
    name: 'Otros Gastos Diferidos',
    allowsMovements: false,
  },
  {
    code: '181-05-00-00',
    aux: '001',
    name: 'GASTOS DIFERIDOS SAN CRISTOBAL',
    allowsMovements: true,
  },
  {
    code: '181-05-00-00',
    aux: '002',
    name: 'Gastos Registrales y de constitución',
    allowsMovements: true,
  },
  {
    code: '181-05-00-00',
    aux: '003',
    name: 'Gastos de Diferidos',
    allowsMovements: true,
  },
  {
    code: '181-06-00-00',
    name: 'Otros Gastos Diferidos',
    allowsMovements: false,
  },
  {
    code: '181-06-00-00',
    aux: '001',
    name: 'OTROS GASTOS DIFERIDOS',
    allowsMovements: true,
  },

  // Amortización Acumulada (181.98.xx.xx)
  {
    code: '181-98-00-00',
    name: '(Amortización Acumulada)',
    allowsMovements: false,
  },
  // Amortización Acumulada (181.98.xx.xx - continuación)
  {
    code: '181-98-01-00',
    name: 'AMORTIZACION ACUMULADA',
    allowsMovements: false,
  },
  {
    code: '181-98-01-00',
    aux: '001',
    name: 'Amortiz. Acumul. Adquisicion Software',
    allowsMovements: true,
  },
  {
    code: '181-98-01-00',
    aux: '003',
    name: 'Amortiz. Acumul. Gastos San Cristobal',
    allowsMovements: true,
  },
  {
    code: '181-98-99-00',
    name: '(Amortización Acumulada Compras de Licen',
    allowsMovements: false,
  },
  {
    code: '181-98-99-00',
    name: 'Amortizacion Acumulada Otros Cargos Dif',
    allowsMovements: false,
  },

  // Otros Gastos Diferidos (181.99.xx.xx)
  {
    code: '181-99-00-00',
    name: 'Amortizacion Acumul. Otros Gastos Diferi',
    allowsMovements: false,
  },
  {
    code: '181-99-00-00',
    aux: '001',
    name: 'Otros Gastos Diferidos',
    allowsMovements: true,
  },
  {
    code: '181-99-00-00',
    aux: '005',
    name: 'Gastos Liquidacion San Cristobal',
    allowsMovements: true,
  },
  {
    code: '181-99-00-00',
    aux: '006',
    name: 'Otros Gastos Diferidos',
    allowsMovements: true,
  },

  // Bienes Diversos (182.xx.xx.xx)
  { code: '182-00-00-00', name: 'Bienes Diversos', allowsMovements: false },
  {
    code: '182-01-00-00',
    name: 'Bienes Dados en Alquiler',
    allowsMovements: false,
  },

  // Depreciación Bienes Diversos (182.98.xx.xx)
  {
    code: '182-98-00-00',
    name: '(Depreciación Acumulada de Bienes Divers',
    allowsMovements: false,
  },
  {
    code: '182-98-01-00',
    name: '(Depreciación Acumulada de Bienes Dados)',
    allowsMovements: false,
  },
  {
    code: '182-98-99-00',
    name: '(Depreciación Acumulada Otros Bienes)',
    allowsMovements: false,
  },

  // Otros Bienes (182-99-00-00)
  { code: '182-99-00-00', name: 'Otros Bienes', allowsMovements: false },

  // Varias Cuentas de Activo (183.xx.xx.xx)
  { code: '183-00-00-00', name: 'Varios', allowsMovements: false },
  {
    code: '183-01-00-00',
    name: 'Depósitos Dados en Garantía',
    allowsMovements: false,
  },
  {
    code: '183-02-00-00',
    name: 'Fondos Inmovilizados',
    allowsMovements: false,
  },
  {
    code: '183-02-00-00',
    aux: '001',
    name: 'Liquidaciones Credinomina',
    allowsMovements: true,
  },
  {
    code: '183-03-00-00',
    name: 'Anticipos al Personal',
    allowsMovements: false,
  },
  {
    code: '183-04-00-00',
    name: 'Partida por Conciliar',
    allowsMovements: false,
  },
  {
    code: '183-05-00-00',
    name: 'Papelería, Efectos de Escritorio y Mater',
    allowsMovements: false,
  },
  {
    code: '183-06-00-00',
    name: 'Reclamos a Compañías de Seguros',
    allowsMovements: false,
  },

  // Otras Cuentas por Cobrar (183.99.xx.xx)
  {
    code: '183-99-00-00',
    name: 'OTRAS CUENTAS POR COBRAR VARIAS',
    allowsMovements: false,
  },
  {
    code: '183-99-00-00',
    aux: '003',
    name: 'Otras Cuentas por Cobrar Varias',
    allowsMovements: true,
  },

  // Operaciones en Litigio (184.xx.xx.xx)
  {
    code: '184-00-00-00',
    name: 'Operaciones en Litigio',
    allowsMovements: false,
  },
  {
    code: '184-01-00-00',
    name: 'Operaciones en Litigio',
    allowsMovements: false,
  },

  // Estimación para Operaciones en Litigio (189.xx.xx.xx)
  {
    code: '189-00-00-00',
    name: '(Estimación Para Operaciones en Litigio)',
    allowsMovements: false,
  },
];

const rawAccounts2: RawAccount[] = [
  // PASIVO (200.00.00.00) - INICIO
  { code: '200-00-00-00', name: 'PASIVO', allowsMovements: false },

  // Obligaciones (210.xx.xx.xx)
  { code: '210-00-00-00', name: 'Obligaciones', allowsMovements: false },

  // Cuentas por Pagar (211.xx.xx.xx)
  { code: '211-00-00-00', name: 'Cuentas por Pagar', allowsMovements: false },
  {
    code: '211-01-00-00',
    name: 'Honorarios Profesionales por Pagar',
    allowsMovements: false,
  },
  {
    code: '211-01-01-00',
    name: 'Honorarios Profesionales por Pagar',
    allowsMovements: false,
  },
  {
    code: '211-01-01-00',
    aux: '001',
    name: 'Auditores Externos',
    allowsMovements: true,
  },
  { code: '211-01-01-01', name: 'Auditores Externos', allowsMovements: false },
  { code: '211-01-01-02', name: 'Contador Externo', allowsMovements: false },
  { code: '211-01-01-03', name: 'Asesoría Legal', allowsMovements: false },
  {
    code: '211-01-01-04',
    name: 'Sistemas y Procedimientos',
    allowsMovements: false,
  },
  {
    code: '211-01-99-00',
    name: 'Asesoría Comercial y Financiera',
    allowsMovements: false,
  },
  {
    code: '211-01-99-00',
    aux: '000',
    name: 'Otros Sevicios Externos',
    allowsMovements: false,
  }, // Se asume 000 como agrupación

  // Servicios Básicos por Pagar (211.02.xx.xx)
  {
    code: '211-02-00-00',
    name: 'Servicios Básicos por Pagar',
    allowsMovements: false,
  },
  { code: '211-02-01-00', name: 'Electricidad', allowsMovements: false },
  {
    code: '211-02-01-00',
    aux: '001',
    name: 'Electricidad',
    allowsMovements: true,
  },
  { code: '211-02-02-00', name: 'Telefonía', allowsMovements: false },
  { code: '211-02-02-01', name: 'Fija', allowsMovements: false },
  { code: '211-02-02-02', name: 'Móvil', allowsMovements: false },
  { code: '211-02-03-00', name: 'Agua', allowsMovements: false },
  { code: '211-02-03-01', name: 'Potable', allowsMovements: false },
  {
    code: '211-02-03-02',
    name: 'Por Servicio de Agua',
    allowsMovements: false,
  },

  { code: '211-02-04-00', name: 'Aseo', allowsMovements: false },
  {
    code: '211-02-04-00',
    aux: '001',
    name: 'Aseo - FOSPUCA',
    allowsMovements: true,
  },
  { code: '211-02-05-00', name: 'Condominio', allowsMovements: false },
  {
    code: '211-02-05-00',
    aux: '001',
    name: 'Condominio x Pagar',
    allowsMovements: true,
  },
  { code: '211-02-06-00', name: 'Gas', allowsMovements: false },
  {
    code: '211-02-07-00',
    name: 'Por Acceso a Internet',
    allowsMovements: false,
  },
  { code: '211-02-08-00', name: 'Cable TV', allowsMovements: false },
  { code: '211-02-99-00', name: 'Otros Servicios', allowsMovements: false },

  // Alquileres (211.03.xx.xx)
  { code: '211-03-00-00', name: 'Alquileres', allowsMovements: false },

  // Mercadeo y Publicidad (211.04.xx.xx)
  { code: '211-04-00-00', name: 'PROVEEDORES', allowsMovements: false },
  {
    code: '211-04-00-00',
    aux: '001',
    name: 'Jornada de Salud',
    allowsMovements: true,
  },
  {
    code: '211-04-00-00',
    aux: '002',
    name: 'FARMHOGARPLUS',
    allowsMovements: true,
  },
  {
    code: '211-04-00-00',
    aux: '003',
    name: 'Jornada Salud vs Haberes',
    allowsMovements: true,
  },
  {
    code: '211-04-00-00',
    aux: '006',
    name: 'De Todo SF, C.A',
    allowsMovements: true,
  },

  // Cuentas por Pagar a Asociados (211.05.xx.xx)
  {
    code: '211-05-00-00',
    name: 'Excedentes por Pagar',
    allowsMovements: false,
  }, // Nota: El nombre en la imagen parece desalineado, lo asocio al código 211.05.xx.xx
  { code: '211-05-01-00', name: 'Asociados', allowsMovements: false },
  {
    code: '211-05-01-00',
    aux: '001',
    name: 'Cuentas por Pagar Asociados',
    allowsMovements: true,
  },
  { code: '211-05-02-00', name: 'Ex Asociados', allowsMovements: false },

  // Impuestos y Otros (211.06.xx.xx - 211.11.xx.xx)
  {
    code: '211-06-00-00',
    name: 'Impuestos Retenidos a Terceros (ISLR)',
    allowsMovements: false,
  },
  { code: '211-07-00-00', name: 'Mutuo Auxilio', allowsMovements: false },
  {
    code: '211-07-00-00',
    aux: '001',
    name: 'Cuentas por Pagar Fallecidos',
    allowsMovements: true,
  },
  { code: '211-08-00-00', name: 'Montepio', allowsMovements: false },
  { code: '211-09-00-00', name: 'Viaticos', allowsMovements: false },
  { code: '211-10-00-00', name: 'Dietas', allowsMovements: false },
  {
    code: '211-10-00-00',
    aux: '001',
    name: 'Otras Cuentas por Pagar',
    allowsMovements: true,
  }, // Auxiliar en 211.10.00.00
  {
    code: '211-99-00-00',
    name: 'Otras Cuentas por Pagar al Patrono',
    allowsMovements: false,
  },
  {
    code: '211-99-00-00',
    aux: '099',
    name: 'Otras Cuentas por Pagar',
    allowsMovements: true,
  },

  // Obligaciones Laborales (212.xx.xx.xx)
  {
    code: '212-00-00-00',
    name: 'Compromisos Laborales',
    allowsMovements: false,
  },
  {
    code: '212-01-00-00',
    name: 'Sueldos de Trabajadores por Pagar',
    allowsMovements: false,
  },
  {
    code: '212-01-00-00',
    aux: '001',
    name: 'Sueldos de Trabajadores x Pagar',
    allowsMovements: true,
  },
  { code: '212-02-00-00', name: 'Bono Alimentación', allowsMovements: false },
  {
    code: '212-02-00-00',
    aux: '001',
    name: 'Bono Alimentación',
    allowsMovements: true,
  },
  {
    code: '212-03-00-00',
    name: 'Provision BONO VACACIONAL',
    allowsMovements: false,
  },
  {
    code: '212-03-00-00',
    aux: '001',
    name: 'Provision BONO VACACIONAL',
    allowsMovements: true,
  },
  {
    code: '212-04-00-00',
    name: 'Vacaciones no Disfrutadas',
    allowsMovements: false,
  },
  {
    code: '212-05-00-00',
    name: 'Utilidades por Pagar',
    allowsMovements: false,
  },
  {
    code: '212-05-00-00',
    aux: '001',
    name: 'Utilidades por Pagar',
    allowsMovements: true,
  },
  {
    code: '212-06-00-00',
    name: 'Prestaciones Sociales',
    allowsMovements: false,
  },
  {
    code: '212-06-00-00',
    aux: '001',
    name: 'Prestaciones Sociales',
    allowsMovements: true,
  },
  {
    code: '212-07-00-00',
    name: 'Intereses Sobre Prestaciones Sociales',
    allowsMovements: false,
  },
  { code: '212-08-00-00', name: 'Seguro Colectivo', allowsMovements: false },

  // Cajas de Ahorro (212.09.xx.xx)
  { code: '212-09-01-00', name: 'Caja de Ahorro', allowsMovements: false },
  { code: '212-09-02-00', name: 'Aporte Empleado', allowsMovements: false },
  {
    code: '212-09-02-00',
    aux: '001',
    name: 'Aporte Patronal',
    allowsMovements: true,
  },

  // Seguro Social Obligatorio (212.10.xx.xx)
  {
    code: '212-10-00-00',
    name: 'Seguro Social Obligatorio',
    allowsMovements: false,
  },
  { code: '212-10-01-00', name: 'Aporte Empleado', allowsMovements: false },
  {
    code: '212-10-01-00',
    aux: '001',
    name: 'Aporte Empleado (IVSS)',
    allowsMovements: true,
  },
  { code: '212-10-02-00', name: 'Aporte Patronal', allowsMovements: false },
  {
    code: '212-10-02-00',
    aux: '001',
    name: 'Aporte Patronal (IVSS)',
    allowsMovements: true,
  },

  // Ley de Régimen Prestacional de Empleo (212.11.xx.xx)
  {
    code: '212-11-00-00',
    name: 'Ley de Regimen Prestacional de Empleo',
    allowsMovements: false,
  },
  { code: '212-11-01-00', name: 'Aporte Empleado', allowsMovements: false },
  {
    code: '212-11-01-00',
    aux: '001',
    name: 'Aporte Empleado (LPF)',
    allowsMovements: true,
  },

  { code: '212-11-02-00', name: 'Aporte Patronal', allowsMovements: false },
  {
    code: '212-11-02-00',
    aux: '001',
    name: 'Aporte Patronal (LPF)',
    allowsMovements: true,
  },

  // Fondo de Ahorro Obligatorio para la Vivienda (212.12.xx.xx)
  {
    code: '212-12-00-00',
    name: 'Fondo de Ahorro Obligatorio Para la Vivi',
    allowsMovements: false,
  },
  { code: '212-12-01-00', name: 'Aporte Empleado', allowsMovements: false },
  {
    code: '212-12-01-00',
    aux: '001',
    name: 'Aporte Empleado (FAOV)',
    allowsMovements: true,
  },
  { code: '212-12-02-00', name: 'Aporte Patronal', allowsMovements: false },
  {
    code: '212-12-02-00',
    aux: '001',
    name: 'Aporte Patronal (FAOV)',
    allowsMovements: true,
  },

  // Otras Obligaciones (212.99.xx.xx)
  {
    code: '212-99-00-00',
    name: 'Otras Obligaciones Contractuales',
    allowsMovements: false,
  },

  // Haberes por Pagar (213.xx.xx.xx)
  { code: '213-00-00-00', name: 'Haberes por Pagar', allowsMovements: false },
  { code: '213-01-00-00', name: 'Haberes Asociados', allowsMovements: false },
  {
    code: '213-02-00-00',
    name: 'Haberes Ex - Asociados',
    allowsMovements: false,
  },

  // Liquidación Total de Fondos (213.02.xx.xx)
  {
    code: '213-02-00-00',
    aux: '498',
    name: 'Liquidacion Total de Fondos SOCIO',
    allowsMovements: true,
  },

  // Créditos Diferidos (230.xx.xx.xx)
  { code: '230-00-00-00', name: 'Créditos Diferidos', allowsMovements: false },

  // Intereses Diferidos (231.xx.xx.xx)
  { code: '231-00-00-00', name: 'Intereses Diferidos', allowsMovements: false },
  {
    code: '231-01-00-00',
    name: 'Colocaciones en Bancos e Instituciones F',
    allowsMovements: false,
  },
  {
    code: '231-02-00-00',
    name: 'Intereses por Cobrar por Prestamos con G',
    allowsMovements: false,
  },
  {
    code: '231-03-00-00',
    name: 'Intereses por Cobrar por Prestamos con R',
    allowsMovements: false,
  },
  {
    code: '231-04-00-00',
    name: 'Intereses por Cobrar por Prestamos con G',
    allowsMovements: false,
  },
  {
    code: '231-05-00-00',
    name: 'Intereses por Cobrar por Prestamos Otorg',
    allowsMovements: false,
  },
  {
    code: '231-06-00-00',
    name: 'Cartera de Inversiones',
    allowsMovements: false,
  },
  { code: '231-07-00-00', name: 'Prestamos Vencidos', allowsMovements: false },
  {
    code: '231-08-00-00',
    name: 'Prestamos en Litigio',
    allowsMovements: false,
  },
  {
    code: '231-09-00-00',
    name: 'Intereses por Incumplimiento de Pago del',
    allowsMovements: false,
  },

  // Ingresos Diferidos (232.xx.xx.xx)
  { code: '232-00-00-00', name: 'Ingresos Diferidos', allowsMovements: false },
  {
    code: '232-01-00-00',
    name: 'Intereses Sobre Prestamos Diferidos',
    allowsMovements: false,
  },
  {
    code: '232-02-00-00',
    name: 'Ganancias en Bienes Inmuebles Recuperado',
    allowsMovements: false,
  },

  // Alquileres Cobrados por Anticipado (240.xx.xx.xx)
  {
    code: '240-00-00-00',
    name: 'Alquileres Cobrados por Anticipado',
    allowsMovements: false,
  },

  // Otros Pasivos (241.xx.xx.xx)
  { code: '241-00-00-00', name: 'Otros Pasivos', allowsMovements: false },
  {
    code: '241-01-00-00',
    name: 'Operaciones por Conciliar',
    allowsMovements: false,
  },
  { code: '241-02-00-00', name: 'Bancos Públicos', allowsMovements: false },
  {
    code: '241-02-00-00',
    aux: '001',
    name: 'Depositos por Identificar',
    allowsMovements: true,
  },
  { code: '241-03-00-00', name: 'Bancos Privados', allowsMovements: false },
  { code: '242-00-00-00', name: 'Varios', allowsMovements: false },
  {
    code: '242-99-00-00',
    name: 'Otras Cuentas por Pagar',
    allowsMovements: false,
  },
];

const rawAccounts3: RawAccount[] = [
  // PATRIMONIO (300.00.00.00) - INICIO
  { code: '300-00-00-00', name: 'PATRIMONIO', allowsMovements: false },

  // Haberes (310.xx.xx.xx)
  { code: '310-00-00-00', name: 'HABERES', allowsMovements: false },
  { code: '311-00-00-00', name: 'Aportes Recibidos', allowsMovements: false },

  // Aporte del Asociado (311.01.xx.xx)
  { code: '311-01-01-00', name: 'Aporte del Asociado', allowsMovements: false },
  {
    code: '311-01-01-00',
    aux: '001',
    name: 'Del Asociado',
    allowsMovements: true,
  },
  { code: '311-01-02-00', name: 'APORTE ASOCIADOS', allowsMovements: false },

  // Excedentes (311.02.xx.xx)
  { code: '311-02-00-00', name: 'Excedentes', allowsMovements: false },
  { code: '311-02-01-00', name: 'EXCEDENTES', allowsMovements: false },

  // Voluntarios (311.03.xx.xx)
  { code: '311-03-01-00', name: 'Voluntarios', allowsMovements: false },
  {
    code: '311-03-01-00',
    aux: '001',
    name: 'Aportes Voluntarios',
    allowsMovements: true,
  },

  // Aporte del Empleador (311.04.xx.xx)
  {
    code: '311-04-00-00',
    name: 'Aporte del Empleador',
    allowsMovements: false,
  },
  { code: '311-04-02-00', name: 'APORTE PATRONAL', allowsMovements: false },

  // Retiros Parciales (311.03.xx.xx) - Nota: Código 311.03.xx.xx se reutiliza, asumiendo estructura del plan de cuentas
  { code: '311-03-00-00', name: '(Retiros Parciales)', allowsMovements: false },
  {
    code: '311-03-00-00',
    aux: '001',
    name: 'RETIROS PARCIALES',
    allowsMovements: true,
  },
  {
    code: '311-03-00-00',
    aux: '002',
    name: 'Retiro Parcial-Combos Escolar',
    allowsMovements: true,
  }, // Auxiliar 002 repetido con distinto nombre, se mantiene como está en la imagen.
  {
    code: '311-03-00-00',
    aux: '003',
    name: 'RETIRO PARCIAL APORTE PRESTAMO',
    allowsMovements: true,
  },
  {
    code: '311-03-00-00',
    aux: '004',
    name: 'JORNADA SALUD vs HABERES',
    allowsMovements: true,
  },

  // Aporte del Empleador (311.04.xx.xx - continuación)
  {
    code: '311-04-00-00',
    name: 'Aporte Especial del Empleador',
    allowsMovements: true,
  },

  // Aportes No Recibidos (312.xx.xx.xx)
  {
    code: '312-00-00-00',
    name: 'APORTES NO RECIBIDOS',
    allowsMovements: false,
  },
  { code: '312-01-00-00', name: 'Aporte del Asociado', allowsMovements: false },
  {
    code: '312-01-00-00',
    aux: '001',
    name: 'APORTES NO RECIBIDOS ASOCIADO',
    allowsMovements: true,
  },
  {
    code: '312-02-00-00',
    name: 'Aporte del Empleador',
    allowsMovements: false,
  },
  {
    code: '312-02-00-00',
    aux: '001',
    name: 'APORTE PATRONAL NO RECIBIDOS',
    allowsMovements: true,
  },

  // Reservas Legales (320.xx.xx.xx)
  { code: '320-00-00-00', name: 'RESERVAS', allowsMovements: false },
  { code: '321-00-00-00', name: 'RESERVAS LEGALES', allowsMovements: false },
  {
    code: '321-01-00-00',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  {
    code: '321-01-00-00',
    aux: '001',
    name: 'Reserva de Emergencia',
    allowsMovements: true,
  },
  { code: '321-02-00-00', name: 'Reservas Especiales', allowsMovements: false },
  { code: '321-99-00-00', name: 'Otras Reservas', allowsMovements: false },

  // Ganancia o Perdida No Realizada (330.xx.xx.xx)
  {
    code: '330-00-00-00',
    name: 'Ganancia o Perdida no Realizada en Inver',
    allowsMovements: false,
  },
  {
    code: '331-00-00-00',
    name: 'Ganancia o Perdida no Realizada en Inver',
    allowsMovements: false,
  },
  {
    code: '331-01-00-00',
    name: 'Ganancia o Perdida no Realizada en Inversiones',
    allowsMovements: false,
  },
  {
    code: '331-01-00-00',
    aux: '001',
    name: 'Ganancia o Perdida No Realizada en Inversiones',
    allowsMovements: true,
  },
  {
    code: '331-01-00-00',
    aux: '003',
    name: 'Pago de Haberes Mensuales',
    allowsMovements: true,
  },
  {
    code: '331-02-00-00',
    name: 'Ganancia o Perdida no Realizada',
    allowsMovements: false,
  },
  {
    code: '331-03-00-00',
    name: 'Ganancia o Perdida no Realizada',
    allowsMovements: false,
  },
  {
    code: '331-03-00-00',
    aux: '001',
    name: 'Ganancia o Perdida No Realizada',
    allowsMovements: true,
  },

  // Excedente o Déficit (340.xx.xx.xx)
  { code: '340-00-00-00', name: 'Excedente o Deficit', allowsMovements: false },
  { code: '341-00-00-00', name: 'Excedente o Deficit', allowsMovements: false },
  {
    code: '341-01-00-00',
    name: 'Excedente o Deficit del Ejercicio Actual',
    allowsMovements: false,
  },
  {
    code: '341-01-00-00',
    aux: '001',
    name: 'Excedente o Deficit del Ejercicio Actual',
    allowsMovements: true,
  },
  {
    code: '341-01-00-00',
    aux: '002',
    name: 'Excedente o Deficit del Ejercicio',
    allowsMovements: true,
  },
  {
    code: '341-02-00-00',
    name: 'Excedente o Deficit de Ejercicios Anteriores',
    allowsMovements: false,
  },
  {
    code: '341-02-00-00',
    aux: '001',
    name: 'EXCEDENTE O DEFICIT EJERCICIO ANTERIOR',
    allowsMovements: true,
  },

  // Donaciones Recibidas (350.xx.xx.xx)
  {
    code: '350-00-00-00',
    name: 'Donaciones Recibidas',
    allowsMovements: false,
  },
  {
    code: '351-00-00-00',
    name: 'Donaciones Recibidas',
    allowsMovements: false,
  },
  {
    code: '351-01-00-00',
    name: 'Donaciones Recibidas',
    allowsMovements: false,
  },
];

const rawAccounts4: RawAccount[] = [
  // INGRESOS (400.00.00.00) - INICIO
  { code: '400-00-00-00', name: 'Ingresos', allowsMovements: false },

  // Ingresos por Cartera de Préstamos (410.xx.xx.xx)
  {
    code: '410-00-00-00',
    name: 'Ingresos por Cartera de Prestamos',
    allowsMovements: false,
  },
  {
    code: '411-00-00-00',
    name: 'Ingresos por Prestamos con Garantia de H',
    allowsMovements: false,
  },

  // Corto Plazo (411.01.xx.xx)
  { code: '411-01-00-00', name: 'Corto Plazo', allowsMovements: false },
  {
    code: '411-01-00-00',
    aux: '001',
    name: 'Intereses Prestamo Corto Plazo',
    allowsMovements: true,
  },
  {
    code: '411-01-00-00',
    aux: '018',
    name: 'Intereses Ganado Credito Comercial',
    allowsMovements: true,
  },
  {
    code: '411-01-00-00',
    aux: '019',
    name: 'Intereses Ganados Credito Celular',
    allowsMovements: true,
  },
  {
    code: '411-01-00-00',
    aux: '099',
    name: 'Intereses Ganado Jornada de Salud',
    allowsMovements: true,
  }, // Asumo 099 por la posición

  // Mediano Plazo (411.02.xx.xx)
  { code: '411-02-00-00', name: 'Mediano Plazo', allowsMovements: false },
  {
    code: '411-02-00-00',
    aux: '001',
    name: 'Intereses Prestamos Mediano Plazo',
    allowsMovements: true,
  },

  // Largo Plazo (411.03.xx.xx)
  { code: '411-03-00-00', name: 'Largo Plazo', allowsMovements: false },
  {
    code: '411-03-00-00',
    aux: '001',
    name: 'Intereses Prestamos Largo Plazo',
    allowsMovements: true,
  },

  // Intereses de Préstamos con Garantía de Haberes (412.xx.xx.xx)
  {
    code: '412-00-00-00',
    name: 'Intereses de Prestamos con Garantia de H',
    allowsMovements: false,
  },
  { code: '412-01-00-00', name: 'Corto Plazo', allowsMovements: false },
  { code: '412-02-00-00', name: 'Mediano Plazo', allowsMovements: false },
  { code: '412-03-00-00', name: 'Largo Plazo', allowsMovements: false },

  // Intereses por Préstamos con Reserva de Dominio (413.xx.xx.xx)
  {
    code: '413-00-00-00',
    name: 'Intereses por Prestamos con Reserva de D',
    allowsMovements: false,
  },
  {
    code: '413-01-00-00',
    name: 'Intereses por Prestamos con Reserva de D',
    allowsMovements: false,
  },
  {
    code: '413-01-00-00',
    aux: '001',
    name: 'Intereses Prestamos Vehiculos',
    allowsMovements: true,
  },

  // Intereses por Préstamos con Garantía Hipotecaria (414.xx.xx.xx)
  {
    code: '414-00-00-00',
    name: 'Intereses por Prestamos con Garantia Hip',
    allowsMovements: false,
  },
  { code: '414-01-00-00', name: 'Adquisicion', allowsMovements: false },
  {
    code: '414-01-00-00',
    aux: '001',
    name: 'INTERESES PRESTAMOS HIPOTECARIOS',
    allowsMovements: true,
  },

  // Intereses por Préstamos Hipotecarios (414.xx.xx.xx - continuación)
  { code: '414-02-00-00', name: 'Construccion', allowsMovements: false },
  { code: '414-03-00-00', name: 'Terminacion', allowsMovements: false },
  { code: '414-04-00-00', name: 'Ampliacion', allowsMovements: false },
  { code: '414-05-00-00', name: 'Remodelacion', allowsMovements: false },
  {
    code: '414-05-00-00',
    aux: '001',
    name: 'Intereses Hipotecarios Remodelacion',
    allowsMovements: true,
  },
  {
    code: '414-06-00-00',
    name: 'Liberacion de Hipoteca',
    allowsMovements: false,
  },

  // Intereses por Préstamos a Ex Asociados (415.xx.xx.xx)
  {
    code: '415-00-00-00',
    name: 'Intereses por Prestamos a Ex Asociados',
    allowsMovements: false,
  },
  {
    code: '415-01-00-00',
    name: 'Intereses por Prestamos con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '415-02-00-00',
    name: 'Intereses por Prestamos con Garantia Hip',
    allowsMovements: false,
  },
  { code: '415-02-01-00', name: 'Adquisicion', allowsMovements: false },
  { code: '415-02-02-00', name: 'Construccion', allowsMovements: false },
  { code: '415-02-03-00', name: 'Terminacion', allowsMovements: false },
  { code: '415-02-04-00', name: 'Ampliacion', allowsMovements: false },
  { code: '415-02-05-00', name: 'Remodelacion', allowsMovements: false },
  {
    code: '415-02-06-00',
    name: 'Liberacion de Hipoteca',
    allowsMovements: false,
  },

  // Intereses por Préstamos Vencidos (416.xx.xx.xx)
  {
    code: '416-00-00-00',
    name: 'Intereses por Prestamos Vencidos',
    allowsMovements: false,
  },
  {
    code: '416-01-00-00',
    name: 'Con Garantia de Haberes',
    allowsMovements: false,
  },
  { code: '416-01-01-00', name: 'Corto Plazo', allowsMovements: false },
  { code: '416-01-02-00', name: 'Mediano Plazo', allowsMovements: false },
  { code: '416-01-03-00', name: 'Largo Plazo', allowsMovements: false },
  {
    code: '416-02-00-00',
    name: 'Prestamos con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '416-03-00-00',
    name: 'Intereses por Prestamos con Garantia Hip',
    allowsMovements: false,
  },
  { code: '416-03-01-00', name: 'Adquisicion', allowsMovements: false },
  { code: '416-03-02-00', name: 'Construccion', allowsMovements: false },
  { code: '416-03-03-00', name: 'Terminacion', allowsMovements: false },
  { code: '416-03-04-00', name: 'Ampliacion', allowsMovements: false },
  { code: '416-03-05-00', name: 'Remodelacion', allowsMovements: false },
  {
    code: '416-03-06-00',
    name: 'Liberacion de Hipoteca',
    allowsMovements: false,
  },

  // Intereses por Préstamos en Litigio (417.xx.xx.xx)
  {
    code: '417-00-00-00',
    name: 'Intereses por Prestamos en Litigio',
    allowsMovements: false,
  },
  {
    code: '417-01-00-00',
    name: 'Prestamos con Reserva de Dominio',
    allowsMovements: false,
  },
  {
    code: '417-02-00-00',
    name: 'Intereses por Prestamos con Garantia Hip',
    allowsMovements: false,
  },
  { code: '417-02-01-00', name: 'Adquisicion', allowsMovements: false },
  { code: '417-02-02-00', name: 'Construccion', allowsMovements: false },
  { code: '417-02-03-00', name: 'Terminacion', allowsMovements: false },
  { code: '417-02-04-00', name: 'Ampliacion', allowsMovements: false },
  { code: '417-02-05-00', name: 'Remodelacion', allowsMovements: false },
  {
    code: '417-02-06-00',
    name: 'Liberacion de Hipoteca',
    allowsMovements: false,
  },

  // Ingresos Financieros (420.xx.xx.xx)
  {
    code: '420-00-00-00',
    name: 'Ingresos Financieros',
    allowsMovements: false,
  },
  {
    code: '421-00-00-00',
    name: 'Rendimiento en Bancos e Instituciones Fi',
    allowsMovements: false,
  },

  // Rendimientos Sector Público (421.01.xx.xx)
  { code: '421-01-00-00', name: 'Sector Publico', allowsMovements: false },
  { code: '421-01-01-00', name: 'Moneda Nacional', allowsMovements: false },
  {
    code: '421-01-01-01',
    name: 'Moneda Nacional-Sector Publico',
    allowsMovements: false,
  },
  {
    code: '421-01-01-01',
    aux: '001',
    name: 'Por Cuentas Corrientes',
    allowsMovements: true,
  },
  { code: '421-01-01-02', name: 'Cuentas Corrientes', allowsMovements: false },
  {
    code: '421-01-01-02',
    aux: '001',
    name: 'Por Cuentas de Ahorro',
    allowsMovements: true,
  },
  {
    code: '421-01-01-03',
    name: 'Colocaciones Menores o Iguales a 90 Dias',
    allowsMovements: false,
  },
  {
    code: '421-01-01-04',
    name: 'Fideicomisos de Inversion',
    allowsMovements: false,
  },
  {
    code: '421-01-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },
  { code: '421-01-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  {
    code: '421-01-02-01',
    name: 'Por Cuentas Corrientes',
    allowsMovements: false,
  },
  {
    code: '421-01-02-02',
    name: 'Por Cuentas de Ahorro',
    allowsMovements: false,
  },

  {
    code: '421-01-02-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '421-01-02-04',
    name: 'Fideicomiso de Inversion',
    allowsMovements: false,
  },
  {
    code: '421-01-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Rendimientos Sector Privado (421.02.xx.xx)
  { code: '421-02-00-00', name: 'Sector Privado', allowsMovements: false },
  { code: '421-02-01-00', name: 'Moneda Nacional', allowsMovements: false },
  {
    code: '421-02-01-01',
    name: 'Moneda Nacional-Sector Privado',
    allowsMovements: false,
  },
  {
    code: '421-02-01-01',
    aux: '001',
    name: 'Por Cuentas Corrientes',
    allowsMovements: true,
  },
  {
    code: '421-02-01-02',
    name: 'Por Cuentas de Ahorro',
    allowsMovements: false,
  },
  {
    code: '421-02-01-02',
    aux: '001',
    name: 'Por Cuentas de Ahorro',
    allowsMovements: true,
  },
  {
    code: '421-02-01-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '421-02-01-04',
    name: 'Fideicomiso de Inversion',
    allowsMovements: false,
  },
  {
    code: '421-02-01-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },
  { code: '421-02-02-00', name: 'Moneda Extranjera', allowsMovements: false },
  {
    code: '421-02-02-01',
    name: 'Por Cuentas Corrientes',
    allowsMovements: false,
  },
  {
    code: '421-02-02-02',
    name: 'Por Cuentas de Ahorro',
    allowsMovements: false,
  },
  {
    code: '421-02-02-03',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '421-02-02-04',
    name: 'Fideicomiso de Inversion',
    allowsMovements: false,
  },
  {
    code: '421-02-02-99',
    name: 'Otras Operaciones Menores o Iguales a No',
    allowsMovements: false,
  },

  // Rendimiento por Disponibilidad Restringida (421.03.xx.xx)
  {
    code: '421-03-00-00',
    name: 'Rendimientos por Disponibilidad Restring',
    allowsMovements: false,
  },
  { code: '421-03-01-00', name: 'Sector Publico', allowsMovements: false },
  {
    code: '421-03-01-01',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  { code: '421-03-01-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '421-03-01-99', name: 'Otras Reservas', allowsMovements: false },
  { code: '421-03-02-00', name: 'Sector Privado', allowsMovements: false },
  {
    code: '421-03-02-01',
    name: 'Reserva de Emergencia',
    allowsMovements: false,
  },
  { code: '421-03-02-02', name: 'Reservas Especiales', allowsMovements: false },
  { code: '421-03-02-99', name: 'Otras Reservas', allowsMovements: false },

  // Rendimiento sobre Cartera de Inversión (430.xx.xx.xx)
  {
    code: '430-00-00-00',
    name: 'Rendimiento Sobre Cartera de Inversion',
    allowsMovements: false,
  },
  {
    code: '431-00-00-00',
    name: 'Rendimientos en Inversiones Disponibles',
    allowsMovements: false,
  },
  {
    code: '431-01-00-00',
    name: 'Rendimiento Bono y Obligaciones de la De',
    allowsMovements: false,
  },
  {
    code: '431-02-00-00',
    name: 'Rendimiento Bonos y Obligaciones de Orga',
    allowsMovements: false,
  },
  {
    code: '431-03-00-00',
    name: 'Rendimiento Bonos y Obligaciones Emitida',
    allowsMovements: false,
  },
  {
    code: '431-04-00-00',
    name: 'Rendimiento Bonos y Obligaciones Emitida',
    allowsMovements: false,
  },
  {
    code: '431-05-00-00',
    name: 'Rendimiento Bonos y Obligaciones Emitida',
    allowsMovements: false,
  },
  {
    code: '431-99-00-00',
    name: 'Rendimiento Otras Inversiones en Titulo',
    allowsMovements: false,
  },

  // Rendimiento en Inversiones Mantenidas Hasta su Vencimiento (432.xx.xx.xx)
  {
    code: '432-00-00-00',
    name: 'Rendimiento en Inversiones Mantenidas Ha',
    allowsMovements: false,
  },
  {
    code: '432-01-00-00',
    name: 'Rendimientos por Bonos y Obligaciones de',
    allowsMovements: false,
  },
  {
    code: '432-02-00-00',
    name: 'Rendimientos por Bonos y Obligaciones de',
    allowsMovements: false,
  },
  {
    code: '432-03-00-00',
    name: 'Rendimientos por Bonos y Obligaciones Em',
    allowsMovements: false,
  },
  {
    code: '432-04-00-00',
    name: 'Rendimientos por Bonos y Obligaciones Em',
    allowsMovements: false,
  },
  {
    code: '432-05-00-00',
    name: 'Rendimientos por Bonos y Obligaciones Em',
    allowsMovements: false,
  },
  {
    code: '432-99-00-00',
    name: 'Rendimientos por Otras Inversiones en Ti',
    allowsMovements: false,
  },

  // Ganancias en Inversiones (433.xx.xx.xx)
  {
    code: '433-00-00-00',
    name: 'Ganancias en Inversiones en Relacionadas',
    allowsMovements: false,
  },
  {
    code: '434-00-00-00',
    name: 'Ganancias en Asociadas',
    allowsMovements: false,
  },

  // Ganancias en Venta de Inversiones (433.xx.xx.xx)
  {
    code: '433-00-00-00',
    name: 'Ganancias en Venta de las Inversiones en',
    allowsMovements: false,
  }, // Se repite 433-00-00-00, siguiendo la imagen

  // Rendimientos en Otras Inversiones (434.xx.xx.xx)
  {
    code: '434-00-00-00',
    name: 'Rendimientos en Otras Inversiones',
    allowsMovements: false,
  }, // Se repite 434-00-00-00, siguiendo la imagen

  // Colocaciones Financieras (434.01.xx.xx)
  {
    code: '434-01-00-00',
    name: 'Colocaciones Financieras',
    allowsMovements: false,
  },

  // Rendimientos por Inversiones Restringidas (440.xx.xx.xx)
  {
    code: '440-00-00-00',
    name: 'Rendimientos por Inversiones Restringida',
    allowsMovements: false,
  },

  // Otros Ingresos Operativos (440.xx.xx.xx)
  {
    code: '440-00-00-00',
    name: 'Rendimientos por Otros Ingresos Operativos (Mayo',
    allowsMovements: false,
  }, // Se repite 440-00-00-00, siguiendo la imagen

  // Ingresos por Diferencias de Cambio (441.xx.xx.xx)
  {
    code: '441-00-00-00',
    name: 'Ingresos por Diferencias de Cambio',
    allowsMovements: false,
  },

  // Ingresos por Diferencias de Cambio (441.xx.xx.xx - continuación)
  {
    code: '441-00-00-00',
    name: 'Bancos e Instituciones Financieras',
    allowsMovements: false,
  }, // Se repite 441-00-00-00, siguiendo la imagen
  { code: '441-01-00-00', name: 'Moneda Nacional', allowsMovements: false },
  { code: '441-01-01-00', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '441-01-02-00', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '441-01-03-00',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '441-01-04-00',
    name: 'Fideicomiso de Inversion',
    allowsMovements: false,
  },
  { code: '441-01-99-00', name: 'Otras Operaciones', allowsMovements: false },

  // Ingresos por Cartera de Inversiones (442.xx.xx.xx)
  {
    code: '442-00-00-00',
    name: 'Cartera de Inversion',
    allowsMovements: false,
  },
  {
    code: '442-01-00-00',
    name: 'Bonos u Obligaciones de la Deuda Publica',
    allowsMovements: false,
  },
  {
    code: '442-02-00-00',
    name: 'Bonos u Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '442-03-00-00',
    name: 'Bonos u Obligaciones Emitidas por el Ban',
    allowsMovements: false,
  },
  {
    code: '442-04-00-00',
    name: 'Bonos u Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '442-05-00-00',
    name: 'Bonos u Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '442-99-00-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  },

  // Ingresos por Variación en el Valor de las Inversiones (443.xx.xx.xx)
  {
    code: '443-00-00-00',
    name: 'Ingresos por Variacion en el Valor de la Inversiones',
    allowsMovements: false,
  },

  // Ganancias por Venta de Inversiones (442.xx.xx.xx) - Se repite código
  {
    code: '442-00-00-00',
    name: 'Bonos y Obligaciones de la Deuda Publica',
    allowsMovements: false,
  }, // Nota: El código 442-00-00-00 se repite con una descripción diferente.
  {
    code: '442-01-00-00',
    name: 'Bonos y Obligaciones de la Deuda Publica',
    allowsMovements: false,
  },
  {
    code: '442-02-00-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '442-03-00-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '442-04-00-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '442-05-00-00',
    name: 'Bonos y Obligaciones Emitidas por Empres',
    allowsMovements: false,
  },
  {
    code: '442-99-00-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  }, // Se repite 442-99-00-00

  // Ingresos Operativos Varios (449.xx.xx.xx)
  {
    code: '449-00-00-00',
    name: 'Ingresos Operativos Varios',
    allowsMovements: false,
  },
  {
    code: '449-01-00-00',
    name: 'Ingresos por Alquiler de Bienes',
    allowsMovements: false,
  },
  {
    code: '449-02-00-00',
    name: 'Ingresos por Recuperacion de Gastos',
    allowsMovements: false,
  },
  {
    code: '449-03-00-00',
    name: 'Disminucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '449-04-00-00',
    name: 'Intereses por el Incumplimiento del Empl',
    allowsMovements: false,
  },
  {
    code: '449-05-00-00',
    name: 'Ingresos por Inmuebles Terminados y Term',
    allowsMovements: false,
  },
  {
    code: '449-05-01-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  {
    code: '449-05-01-00',
    aux: '001',
    name: 'Ingresos Las Olas Resort',
    allowsMovements: true,
  },
  {
    code: '449-05-01-00',
    aux: '002',
    name: 'Ingresos Las Islas del Sol',
    allowsMovements: true,
  },
  {
    code: '449-05-01-00',
    aux: '003',
    name: 'Ingresos Coarl Suites',
    allowsMovements: true,
  },
  { code: '449-05-99-00', name: 'Servicios', allowsMovements: false }, // Se asume 449-05-99-00 para Servicios
  {
    code: '449-99-00-00',
    name: 'Ingresos Operativos Varios',
    allowsMovements: false,
  },
  {
    code: '449-99-00-00',
    aux: '001',
    name: 'Ingresos Operativos Varios',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '003',
    name: 'Ingresos por Ventas de CELULARES',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '004',
    name: 'Ingresos por Venta de JUGUETES',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '005',
    name: 'Ingresos por Ventas Automoviles',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '006',
    name: 'Ingresos por Ventas Electrodomesticos',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '007',
    name: 'Ventas de Utiles Escolares',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '008',
    name: 'Ingresos FarmHogar Paquete Recreacional',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '009',
    name: 'Ingresos por Jornada Visual',
    allowsMovements: true,
  },
  {
    code: '449-99-00-00',
    aux: '010',
    name: 'Comision Gastos Adm. Retiro Parcial',
    allowsMovements: true,
  },

  // Ingresos por Bienes Recuperados (450.xx.xx.xx)
  {
    code: '450-00-00-00',
    name: 'Ingresos por Bienes Recuperados',
    allowsMovements: false,
  },
  {
    code: '451-00-00-00',
    name: 'Ingresos por Venta de Bienes Muebles Rec',
    allowsMovements: false,
  },
  {
    code: '452-00-00-00',
    name: 'Ingresos por Venta de Bienes Inmuebles R',
    allowsMovements: false,
  },

  // Ingresos Extraordinarios (460.xx.xx.xx)
  {
    code: '460-00-00-00',
    name: 'Ingresos Extraordinarios',
    allowsMovements: false,
  },
  { code: '461-00-00-00', name: 'Ventas de Activos', allowsMovements: false },
  {
    code: '461-01-00-00',
    name: 'Excedentes no Reclamados por Ex Asociado',
    allowsMovements: false,
  },
  {
    code: '461-03-00-00',
    name: 'Haberes de Ex Asociados no Reclamados',
    allowsMovements: false,
  },
  { code: '461-99-00-00', name: 'Otros Ingresos', allowsMovements: false },

  // Otros Ingresos (461.99.xx.xx - continuación)
  {
    code: '461-99-00-00',
    aux: '001',
    name: 'Otros Ingresos',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '003',
    name: 'Ingresos por Ventas de Celulares',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '004',
    name: 'Ingresos por Ventas de Juguetes',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '005',
    name: 'Ingresos por Ventas Aceite Automoviles',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '006',
    name: 'Ingresos por Ventas de Electrodomestico',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '007',
    name: 'Ingresos por Ventas Utiles Escolares',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '008',
    name: 'Ingresos por Ventas de Alimentos',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '009',
    name: 'Ingresos por Jornada Visual',
    allowsMovements: true,
  },
  {
    code: '461-99-00-00',
    aux: '010',
    name: 'Diferencial Cambiario',
    allowsMovements: true,
  },
];

const rawAccounts5: RawAccount[] = [
  // GASTOS (500.00.00.00) - INICIO
  { code: '500-00-00-00', name: 'Gastos', allowsMovements: false },

  // Gastos de Personal (510.xx.xx.xx)
  { code: '510-00-00-00', name: 'Gastos de Personal', allowsMovements: false },
  { code: '511-00-00-00', name: 'Gastos de Nomina', allowsMovements: false },

  // Sueldos de Empleados (511.01.xx.xx)
  {
    code: '511-01-00-00',
    name: 'Sueldos de Empleados',
    allowsMovements: false,
  },
  {
    code: '511-01-01-00',
    name: 'Sueldos de Empleados Fijos',
    allowsMovements: false,
  },
  {
    code: '511-01-01-00',
    aux: '001',
    name: 'Sueldos de Empleados Fijos',
    allowsMovements: true,
  },
  { code: '511-01-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-01-01-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-01-01-03', name: 'Servicios', allowsMovements: false },
  {
    code: '511-01-02-00',
    name: 'Sueldos de Empleados Contratados',
    allowsMovements: false,
  },
  { code: '511-01-02-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-01-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-01-02-03', name: 'Servicios', allowsMovements: false },

  // Bono Alimentación (511.02.xx.xx)
  { code: '511-02-00-00', name: 'Bono Alimentacion', allowsMovements: false },
  {
    code: '511-02-00-00',
    aux: '001',
    name: 'CestaTicket Socialista',
    allowsMovements: true,
  },
  { code: '511-02-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-02-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-02-03-00', name: 'Servicios', allowsMovements: false },

  // Bono Vacacional (511.03.xx.xx)
  { code: '511-03-00-00', name: 'Bono Vacacional', allowsMovements: false },
  { code: '511-03-01-00', name: 'Bono Vacacional', allowsMovements: false },
  {
    code: '511-03-01-00',
    aux: '001',
    name: 'Bono Vacacional',
    allowsMovements: true,
  },
  {
    code: '511-03-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-03-03-00', name: 'Servicios', allowsMovements: false },

  // Vacaciones (511.04.xx.xx)
  {
    code: '511-04-00-00',
    name: 'Vacaciones no Disfrutadas',
    allowsMovements: false,
  }, // Nota: El nombre en el reporte es 'Vacaciones no Disfrutadas', pero el grupo es 'Vacaciones'
  {
    code: '511-04-00-00',
    aux: '001',
    name: 'Vacaciones',
    allowsMovements: true,
  },
  { code: '511-04-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-04-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-04-04-00', name: 'Servicios', allowsMovements: false },

  // Utilidades (511.05.xx.xx)
  { code: '511-05-00-00', name: 'Utilidades', allowsMovements: false },
  {
    code: '511-05-00-00',
    aux: '001',
    name: 'Utilidades',
    allowsMovements: true,
  },
  { code: '511-05-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-05-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-05-03-00', name: 'Servicios', allowsMovements: false }, // Asumo 511-05-04-00 o una continuación para Servicios

  // Prestaciones Sociales (511.06.xx.xx)
  {
    code: '511-06-00-00',
    name: 'Prestaciones Sociales',
    allowsMovements: false,
  },
  {
    code: '511-06-00-00',
    aux: '001',
    name: 'Prestaciones Sociales',
    allowsMovements: true,
  },
  { code: '511-06-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-06-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-06-03-00', name: 'Servicios', allowsMovements: false }, // Asumo 511-06-04-00 o una continuación para Servicios

  // Intereses Sobre Prestaciones Sociales (511.07.xx.xx)
  {
    code: '511-07-00-00',
    name: 'Intereses Sobre Prestaciones Sociales',
    allowsMovements: false,
  },
  {
    code: '511-07-00-00',
    aux: '001',
    name: 'Intereses S/Prestaciones Sociales',
    allowsMovements: true,
  },
  { code: '511-07-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-07-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },

  // Intereses Sobre Prestaciones Sociales (511.07.xx.xx - continuación)
  { code: '511-07-03-00', name: 'Servicios', allowsMovements: false },

  // Seguro Colectivo (511.08.xx.xx)
  { code: '511-08-00-00', name: 'Seguro Colectivo', allowsMovements: false },
  { code: '511-08-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-08-02-00',
    name: 'Poliza Seguro Empleados',
    allowsMovements: false,
  },
  {
    code: '511-08-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-08-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Caja de Ahorro (511.09.xx.xx)
  { code: '511-09-00-00', name: 'Caja de Ahorro', allowsMovements: false },
  { code: '511-09-01-00', name: 'Caja de Ahorros', allowsMovements: false },
  {
    code: '511-09-01-00',
    aux: '001',
    name: 'Caja de Ahorros',
    allowsMovements: true,
  },
  {
    code: '511-09-02-00',
    name: 'Caja de Ahorros - Asociacion',
    allowsMovements: false,
  },
  {
    code: '511-09-02-00',
    aux: '001',
    name: 'Caja de Ahorros - Asociacion',
    allowsMovements: true,
  },
  {
    code: '511-09-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-09-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Dietas (511.10.xx.xx)
  { code: '511-10-00-00', name: 'Dietas', allowsMovements: false },
  { code: '511-10-01-00', name: 'Administras', allowsMovements: false },
  { code: '511-10-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-10-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-10-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Seguro Social Obligatorio (511.11.xx.xx)
  {
    code: '511-11-00-00',
    name: 'Seguro Social Obligatorio',
    allowsMovements: false,
  },
  {
    code: '511-11-01-00',
    name: 'Seguro Social Obligatorio',
    allowsMovements: false,
  },
  {
    code: '511-11-01-00',
    aux: '001',
    name: 'Seguro Social Obligatorio',
    allowsMovements: true,
  },
  { code: '511-11-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-11-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-11-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Ley de Régimen Prestacional del Empleo (511.12.xx.xx)
  {
    code: '511-12-00-00',
    name: 'Ley de Regimen Prestacional del Empleo',
    allowsMovements: false,
  },
  {
    code: '511-12-01-00',
    name: 'Ley Regimen Prestacional Empleo L.R.P.E',
    allowsMovements: false,
  },
  {
    code: '511-12-01-00',
    aux: '001',
    name: 'Ley Regimen Prestacional de Empleo LRPE',
    allowsMovements: true,
  },
  { code: '511-12-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-12-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-12-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Fondo Ahorro Obligatorio para la Vivienda (511.13.xx.xx)
  {
    code: '511-13-00-00',
    name: 'Fondo Ahorro Obligatorio para la Viviend',
    allowsMovements: false,
  },
  {
    code: '511-13-01-00',
    name: 'Fondo Ahorro Obligatorio P/Vivienda FAOV',
    allowsMovements: false,
  },
  {
    code: '511-13-01-00',
    aux: '001',
    name: 'Fondo Ahorro Obligatorio P/Vivienda FAOV',
    allowsMovements: true,
  },
  { code: '511-13-02-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '511-13-03-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-13-03-00', name: 'Servicios', allowsMovements: false }, // Se asume continuación para Servicios

  // Otras Remuneraciones y Bonificaciones (511.99.xx.xx)
  {
    code: '511-99-00-00',
    name: 'Otras Remuneraciones y Bonificaciones',
    allowsMovements: false,
  },
  {
    code: '511-99-00-00',
    aux: '001',
    name: 'Otras Remuneraciones y Bonificaciones',
    allowsMovements: true,
  },

  // Otros Gastos de Empleados (511.99.xx.xx)
  {
    code: '511-99-01-00',
    name: 'Otros Gastos Empleados',
    allowsMovements: false,
  },
  {
    code: '511-99-01-00',
    aux: '001',
    name: 'Adiestramiento al Personal',
    allowsMovements: true,
  },
  {
    code: '511-99-01-00',
    aux: '002',
    name: 'Uniformes Empleados',
    allowsMovements: true,
  },
  {
    code: '511-99-01-00',
    aux: '003',
    name: 'Otros Gastos Empleados',
    allowsMovements: true,
  },
  {
    code: '511-99-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '511-99-03-00', name: 'Servicios', allowsMovements: false },

  // GASTOS ADMINISTRATIVOS (520.xx.xx.xx)
  {
    code: '520-00-00-00',
    name: 'Gastos Administrativos',
    allowsMovements: false,
  },
  {
    code: '521-00-00-00',
    name: 'Gastos Personal Directivo',
    allowsMovements: false,
  },
  { code: '521-01-00-00', name: 'Dietas', allowsMovements: false },
  { code: '521-02-00-00', name: 'Viaticos', allowsMovements: false },
  { code: '521-03-00-00', name: 'Viaticos', allowsMovements: false },
  { code: '521-03-00-00', aux: '001', name: 'Viaticos', allowsMovements: true }, // Auxiliar en 521-03-00-00

  // Gastos de Asambleas (522.xx.xx.xx)
  { code: '522-00-00-00', name: 'Gastos de Asambleas', allowsMovements: false },
  { code: '522-01-00-00', name: 'Servicios', allowsMovements: false },
  { code: '522-02-00-00', name: 'Avisos de Prensa', allowsMovements: false },
  {
    code: '522-02-00-00',
    aux: '001',
    name: 'Material Impreso',
    allowsMovements: true,
  }, // Auxiliar en 522-02-00-00

  // Gastos de Oficina (522.03.xx.xx)
  {
    code: '522-03-00-00',
    name: 'Alquiler de Mobiliario y Equipos',
    allowsMovements: false,
  },

  // Gastos de Oficina (522.xx.xx.xx - continuación)
  {
    code: '522-04-00-00',
    name: 'Alquiler de Inmuebles',
    allowsMovements: false,
  },
  { code: '522-06-00-00', name: 'Refrigerios', allowsMovements: false },
  { code: '522-99-00-00', name: 'Otros', allowsMovements: false },

  // Gastos Proceso Electoral (523.xx.xx.xx)
  {
    code: '523-00-00-00',
    name: 'Gastos Proceso Electoral',
    allowsMovements: false,
  },
  { code: '523-01-00-00', name: 'Avisos de Prensa', allowsMovements: false },
  { code: '523-02-00-00', name: 'Material Impreso', allowsMovements: false },
  {
    code: '523-03-00-00',
    name: 'Papeleria y Articulos de Escritorio',
    allowsMovements: false,
  },
  {
    code: '523-03-00-00',
    aux: '001',
    name: 'Papeleria y Articulos de Escritorio Com',
    allowsMovements: true,
  },
  { code: '523-04-00-00', name: 'Viaticos', allowsMovements: false },
  {
    code: '523-04-00-00',
    aux: '001',
    name: 'Viaticos y Logistica Com Electoral',
    allowsMovements: true,
  },
  { code: '523-99-00-00', name: 'Otros', allowsMovements: false },
  {
    code: '523-99-00-00',
    aux: '001',
    name: 'Otros Gastos Proceso Electoral',
    allowsMovements: true,
  },

  // Otros Gastos Administrativos (524.xx.xx.xx)
  {
    code: '524-00-00-00',
    name: 'Otros Gastos Administrativos',
    allowsMovements: false,
  },
  {
    code: '524-01-00-00',
    name: 'Mudanza y Otros Traslados',
    allowsMovements: false,
  },
  {
    code: '524-01-00-00',
    aux: '001',
    name: 'Mudanza y Otros Traslados',
    allowsMovements: true,
  },
  { code: '524-02-00-00', name: 'Multas', allowsMovements: false },
  { code: '524-03-00-00', name: 'Notaria y Registro', allowsMovements: false },
  {
    code: '524-04-00-00',
    name: 'Deportes y Estampillas Fiscales',
    allowsMovements: false,
  },
  {
    code: '524-05-00-00',
    name: 'Materiales y Utiles de Aseo',
    allowsMovements: false,
  },
  { code: '524-05-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-05-01-00',
    aux: '001',
    name: 'Materiales y Utiles de Aseo',
    allowsMovements: true,
  },
  {
    code: '524-05-01-00',
    aux: '002',
    name: 'Articulos de Cafeteria',
    allowsMovements: true,
  }, // Auxiliar en 524-05-01-00
  {
    code: '524-05-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-05-03-00', name: 'Servicios', allowsMovements: false },
  {
    code: '524-06-00-00',
    name: 'Papeleria y Articulos de Escritorio',
    allowsMovements: false,
  },
  { code: '524-06-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-06-01-00',
    aux: '001',
    name: 'Costo de Ventas de Celulares',
    allowsMovements: true,
  },
  {
    code: '524-06-01-00',
    aux: '002',
    name: 'Costo de Ventas de Juguetes',
    allowsMovements: true,
  },
  {
    code: '524-06-01-00',
    aux: '007',
    name: 'Costo de Ventas Utiles Escolares',
    allowsMovements: true,
  },
  {
    code: '524-06-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-06-03-00', name: 'Servicios', allowsMovements: false },
  { code: '524-07-00-00', name: 'Combustibles', allowsMovements: false },
  { code: '524-08-00-00', name: 'Polizas de Seguros', allowsMovements: false },
  { code: '524-08-01-00', name: 'Fidelidad', allowsMovements: false },
  {
    code: '524-08-02-00',
    name: 'Incendio y Desastre Natural',
    allowsMovements: false,
  },
  { code: '524-08-02-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-08-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-08-02-03', name: 'Servicios', allowsMovements: false },
  { code: '524-08-03-00', name: 'Vehiculos', allowsMovements: false },
  { code: '524-08-03-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-08-03-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-08-03-03', name: 'Servicios', allowsMovements: false },
  { code: '524-08-04-00', name: 'Otras Primas', allowsMovements: false },
  { code: '524-08-99-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-08-99-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-08-99-03', name: 'Servicios', allowsMovements: false },
  {
    code: '524-09-00-00',
    name: 'Correos y Encomiendas',
    allowsMovements: false,
  },
  { code: '524-09-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '524-09-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '524-09-03-00', name: 'Servicios', allowsMovements: false },
  {
    code: '524-99-00-00',
    name: 'Otros Gastos Administrativos',
    allowsMovements: false,
  },

  // Otros Gastos Administrativos (524.99.xx.xx - continuación)
  {
    code: '524-99-00-00',
    aux: '001',
    name: 'Otros Gastos Administrativos',
    allowsMovements: true,
  },

  // Gastos de Ventas Asociados (524.99.xx.xx)
  {
    code: '524-99-01-00',
    name: 'Gastos Ventas Asociados',
    allowsMovements: false,
  },
  {
    code: '524-99-01-00',
    aux: '001',
    name: 'Uniformes Empleados',
    allowsMovements: true,
  },

  // Inversiones Recreacionales (524.99.xx.xx)
  {
    code: '524-99-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  {
    code: '524-99-02-00',
    aux: '001',
    name: 'Otros Gastos Administ. - Invers. Recreacion',
    allowsMovements: true,
  },
  { code: '524-99-03-00', name: 'Servicios', allowsMovements: false },

  // GASTOS POR SERVICIOS RECIBIDOS (530.xx.xx.xx) - INICIO
  {
    code: '530-00-00-00',
    name: 'Pagos por Servicios Recibidos',
    allowsMovements: false,
  },

  // Gastos por Honorarios Profesionales (531.xx.xx.xx)
  {
    code: '531-00-00-00',
    name: 'Gastos por Honorarios Profesionales',
    allowsMovements: false,
  },

  // Auditores Externos (531.01.xx.xx)
  { code: '531-01-00-00', name: 'Auditores Externos', allowsMovements: false },
  {
    code: '531-01-00-00',
    aux: '001',
    name: 'Auditores Externos',
    allowsMovements: true,
  },

  // Contadores Externos (531.02.xx.xx)
  { code: '531-02-00-00', name: 'Contador Externo', allowsMovements: false },
  {
    code: '531-02-00-00',
    aux: '001',
    name: 'Contador Externo',
    allowsMovements: true,
  },

  // Asesoría (531.03.xx.xx)
  { code: '531-03-00-00', name: 'Asesoria Legal', allowsMovements: false },
  {
    code: '531-03-00-00',
    aux: '001',
    name: 'Asesoria Legal',
    allowsMovements: true,
  },

  // Sistemas (531.04.xx.xx)
  {
    code: '531-04-00-00',
    name: 'Sistemas y Procedimientos',
    allowsMovements: false,
  },
  {
    code: '531-04-00-00',
    aux: '001',
    name: 'MANEJO REDES ELECTRODOMESTICOS',
    allowsMovements: true,
  },
  { code: '531-04-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '531-04-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '531-04-03-00', name: 'Servicios', allowsMovements: false },

  // Asesoría Comercial (531.05.xx.xx)
  {
    code: '531-05-00-00',
    name: 'Asesoria Comercial y Financiera',
    allowsMovements: false,
  },

  // Otros Servicios Externos (531.99.xx.xx)
  {
    code: '531-99-00-00',
    name: 'Otros Servicios Externos',
    allowsMovements: false,
  },
  {
    code: '531-99-00-00',
    aux: '001',
    name: 'Otros Servicios Externos',
    allowsMovements: true,
  },
  { code: '531-99-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '531-99-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '531-99-03-00', name: 'Servicios', allowsMovements: false },

  // Gastos por Servicios Básicos (532.xx.xx.xx)
  {
    code: '532-00-00-00',
    name: 'Gastos por Servicios Basicos',
    allowsMovements: false,
  },

  // Electricidad y Aseo Urbano (532.01.xx.xx)
  {
    code: '532-01-00-00',
    name: 'Por Servicio de Electricidad y Aseo Urbano',
    allowsMovements: false,
  },
  {
    code: '532-01-00-00',
    aux: '001',
    name: 'Servicio de Electricidad y Aseo Urbano',
    allowsMovements: true,
  },
  { code: '532-01-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-01-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-01-03-00', name: 'Servicios', allowsMovements: false },

  // Telefonía (532.02.xx.xx)
  {
    code: '532-02-00-00',
    name: 'Por Servicio de Telefonia',
    allowsMovements: false,
  },
  { code: '532-02-01-00', name: 'Fija', allowsMovements: false },
  { code: '532-02-01-00', aux: '002', name: 'Fija', allowsMovements: true },
  { code: '532-02-01-00', aux: '003', name: 'Movil', allowsMovements: true },
  { code: '532-02-01-00', aux: '004', name: 'Internet', allowsMovements: true },
  { code: '532-02-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-02-01-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-02-01-03', name: 'Servicios', allowsMovements: false },
  { code: '532-02-02-00', name: 'Movil', allowsMovements: false },
  { code: '532-02-02-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-02-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-02-02-03', name: 'Servicios', allowsMovements: false },
  {
    code: '532-03-00-00',
    name: 'Por Suministro de Agua',
    allowsMovements: false,
  },

  // Agua (532.03.xx.xx)
  { code: '532-03-01-00', name: 'Agua Potable', allowsMovements: false },
  {
    code: '532-03-01-00',
    aux: '001',
    name: 'Agua Potable',
    allowsMovements: true,
  },
  { code: '532-03-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-03-01-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-03-01-03', name: 'Servicios', allowsMovements: false },
  {
    code: '532-03-02-00',
    name: 'Por Suministro de Agua',
    allowsMovements: false,
  }, // Se asume continuación
  { code: '532-03-02-01', name: 'Asociacion', allowsMovements: false },

  // Agua (532.03.xx.xx - continuación)
  {
    code: '532-03-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-03-03-00', name: 'Servicios', allowsMovements: false },

  // Condominios (532.04.xx.xx)
  { code: '532-04-00-00', name: 'Condominio', allowsMovements: false },
  {
    code: '532-04-00-00',
    aux: '001',
    name: 'Condominio SAN CRISTOBAL',
    allowsMovements: true,
  },
  {
    code: '532-04-00-00',
    aux: '002',
    name: 'Omnis Caracas',
    allowsMovements: true,
  },
  { code: '532-04-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-04-01-00',
    aux: '001',
    name: 'Condominio',
    allowsMovements: true,
  },
  {
    code: '532-04-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-04-03-00', name: 'Servicios', allowsMovements: false },

  // Gas (532.05.xx.xx)
  { code: '532-05-00-00', name: 'Por Servicio de Gas', allowsMovements: false },
  { code: '532-05-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-05-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-05-03-00', name: 'Servicios', allowsMovements: false },

  // Internet (532.06.xx.xx)
  {
    code: '532-06-00-00',
    name: 'Por Servicio a Internet',
    allowsMovements: false,
  },
  { code: '532-06-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-06-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-06-03-00', name: 'Servicios', allowsMovements: false },

  // Cable TV (532.07.xx.xx)
  {
    code: '532-07-00-00',
    name: 'Por Servicio de Cable TV',
    allowsMovements: false,
  },
  { code: '532-07-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-07-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-07-03-00', name: 'Servicios', allowsMovements: false },

  // Proveedores (532.08.xx.xx)
  { code: '532-08-00-00', name: 'Proveedores', allowsMovements: false },
  { code: '532-08-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-08-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-08-03-00', name: 'Servicios', allowsMovements: false },

  // Otros Servicios (532.99.xx.xx)
  { code: '532-99-00-00', name: 'Otros Servicios', allowsMovements: false },
  {
    code: '532-99-00-00',
    aux: '001',
    name: 'Otros Servicios',
    allowsMovements: true,
  },
  { code: '532-99-01-00', name: 'Asociacion', allowsMovements: false },
  {
    code: '532-99-02-00',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '532-99-03-00', name: 'Servicios', allowsMovements: false },
  {
    code: '532-99-03-00',
    aux: '004',
    name: 'Servicios Sistema FIDUCIA (Sr. Zapata)',
    allowsMovements: true,
  }, // Auxiliar en 532-99-03-00

  // GASTOS POR MANTENIMIENTO (533.xx.xx.xx) - INICIO
  {
    code: '533-00-00-00',
    name: 'Alquileres y Mantenimientos',
    allowsMovements: false,
  },

  // Alquileres (533.01.xx.xx)
  { code: '533-01-00-00', name: 'Alquileres', allowsMovements: false },
  {
    code: '533-01-00-00',
    aux: '001',
    name: 'Local o Establecimiento',
    allowsMovements: true,
  },
  { code: '533-01-01-00', name: 'Vehiculo', allowsMovements: false },
  { code: '533-01-02-00', name: 'Equipos', allowsMovements: false },

  // Mantenimiento de Equipos y Vehículos (533.02.xx.xx)
  {
    code: '533-02-00-00',
    name: 'Mantenimiento de Equipos y Vehiculos',
    allowsMovements: false,
  },
  {
    code: '533-02-00-00',
    aux: '001',
    name: 'Mantenimiento de Equipos y Vehiculos',
    allowsMovements: true,
  },

  // Aire Acondicionado (533.02.xx.xx)
  { code: '533-02-01-00', name: 'Aire Acondicionado', allowsMovements: false },
  { code: '533-02-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-01-02',
    name: 'Inversion. Recreacionales',
    allowsMovements: false,
  },
  {
    code: '533-02-01-02',
    aux: '001',
    name: 'Inversion. Recreacionales Las Olas Resort',
    allowsMovements: true,
  },
  {
    code: '533-02-01-02',
    aux: '002',
    name: 'Inversion. Recreacion. Las Islas del Sol',
    allowsMovements: true,
  },
  { code: '533-02-01-03', name: 'Servicios', allowsMovements: false },

  // Computación (533.02.xx.xx)
  { code: '533-02-02-00', name: 'Computacion', allowsMovements: false },
  { code: '533-02-02-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-02-02-03', name: 'Servicios', allowsMovements: false },

  // Vehículos (533.02.xx.xx)
  { code: '533-02-03-00', name: 'Vehiculos', allowsMovements: false },
  { code: '533-02-03-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-03-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },

  // Vehículos (533.02.xx.xx - continuación)
  { code: '533-02-03-03', name: 'Servicios', allowsMovements: false },

  // Teléfonos (533.02.xx.xx)
  { code: '533-02-04-00', name: 'Telefonos', allowsMovements: false },
  { code: '533-02-04-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-04-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-02-04-03', name: 'Servicios', allowsMovements: false },

  // Seguridad (533-02-05-00)
  { code: '533-02-05-00', name: 'Seguridad', allowsMovements: false },
  { code: '533-02-05-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-05-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-02-05-03', name: 'Servicios', allowsMovements: false },

  // Otros Equipos (533.02.99.xx)
  { code: '533-02-99-00', name: 'Otros Equipos', allowsMovements: false },
  { code: '533-02-99-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-02-99-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-02-99-03', name: 'Servicios', allowsMovements: false },

  // Mantenimiento de Mobiliario (533.03.xx.xx)
  {
    code: '533-03-00-00',
    name: 'Mantenimiento de Mobiliario',
    allowsMovements: false,
  },
  { code: '533-03-01-00', name: 'Muebles', allowsMovements: false },
  { code: '533-03-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-03-01-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-03-01-03', name: 'Servicios', allowsMovements: false },
  { code: '533-03-02-00', name: 'Archivadores', allowsMovements: false },
  { code: '533-03-99-00', name: 'Otros Muebles', allowsMovements: false },
  { code: '533-03-99-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-03-99-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-03-99-03', name: 'Servicios', allowsMovements: false },

  // Mantenimiento de Inmuebles (533.04.xx.xx)
  {
    code: '533-04-00-00',
    name: 'Mantenimiento de Inmuebles',
    allowsMovements: false,
  },
  {
    code: '533-04-01-00',
    name: 'Mantenimiento de Inmuebles',
    allowsMovements: false,
  },
  {
    code: '533-04-01-00',
    aux: '001',
    name: 'Edificacion',
    allowsMovements: true,
  },
  { code: '533-04-01-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-04-01-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  {
    code: '533-04-01-02',
    aux: '001',
    name: 'Inversiones Recreacionales Coarl Suites',
    allowsMovements: true,
  }, // Auxiliar en 533-04-01-02
  { code: '533-04-01-03', name: 'Servicios', allowsMovements: false },

  // Aseo y Limpieza (533.04.xx.xx)
  {
    code: '533-04-02-00',
    name: 'Servicios de Aseo y Limpieza',
    allowsMovements: false,
  },
  { code: '533-04-02-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-04-02-01',
    aux: '001',
    name: 'Servicios de Aseo y Limpieza Asociacion',
    allowsMovements: true,
  },
  {
    code: '533-04-02-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-04-02-03', name: 'Servicios', allowsMovements: false },

  // Fumigación (533.04.xx.xx)
  {
    code: '533-04-03-00',
    name: 'Servicio de Fumigacion',
    allowsMovements: false,
  },
  { code: '533-04-03-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-04-03-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-04-03-03', name: 'Servicios', allowsMovements: false },

  // Otros Inmuebles (533.04.xx.xx)
  { code: '533-04-99-00', name: 'Otros Inmuebles', allowsMovements: false },
  { code: '533-04-99-01', name: 'Asociacion', allowsMovements: false },
  {
    code: '533-04-99-02',
    name: 'Inversiones Recreacionales',
    allowsMovements: false,
  },
  { code: '533-04-99-03', name: 'Servicios', allowsMovements: false },

  // COSTO DE VENTAS (539.xx.xx.xx) - INICIO
  { code: '539-00-00-00', name: 'Costo de Ventas', allowsMovements: false },
  {
    code: '539-01-00-00',
    name: 'Costo de Ventas Celulares',
    allowsMovements: false,
  },
  {
    code: '539-01-00-00',
    aux: '001',
    name: 'Costo de Ventas Celulares',
    allowsMovements: true,
  },
  {
    code: '539-02-00-00',
    name: 'Costo de Ventas Juguetes',
    allowsMovements: false,
  },
  {
    code: '539-02-00-00',
    aux: '001',
    name: 'Costo de Ventas Juguetes',
    allowsMovements: true,
  },
  {
    code: '539-05-00-00',
    name: 'Costo de Ventas Electrodomesticos',
    allowsMovements: false,
  },
  {
    code: '539-05-00-00',
    aux: '001',
    name: 'Costo de Ventas Electrodomesticos',
    allowsMovements: true,
  },
  {
    code: '539-07-00-00',
    name: 'Costo de Ventas Utiles Escolares',
    allowsMovements: false,
  },

  // Costo de Ventas (539.xx.xx.xx - continuación)
  {
    code: '539-07-00-00',
    aux: '001',
    name: 'Costo de Ventas Utiles Escolares',
    allowsMovements: true,
  },

  // GASTOS DE DEPRECIACIÓN, AMORTIZACIÓN Y ESTIMACIONES (540.xx.xx.xx - INICIO)
  {
    code: '540-00-00-00',
    name: 'Gastos Depreciacion de Activo Fijo, Bien',
    allowsMovements: false,
  },

  // Depreciación de Inmuebles (540.xx.xx.xx)
  {
    code: '540-13-00-00',
    name: 'Gastos de Depreciacion SEDE',
    allowsMovements: false,
  },
  {
    code: '540-13-00-00',
    aux: '001',
    name: 'Gastos de Depreciacion SEDE BELLO CAMPO',
    allowsMovements: true,
  },
  {
    code: '540-14-00-00',
    name: 'Gastos Depreciacion Mejora Sede',
    allowsMovements: false,
  },
  {
    code: '540-14-00-00',
    aux: '001',
    name: 'Gastos Depreciacion Mejora Sede Bello Campo',
    allowsMovements: true,
  },

  // Depreciación de Edificaciones (541.xx.xx.xx)
  {
    code: '541-00-00-00',
    name: 'Gastos de Depreciacion de Edificaciones',
    allowsMovements: false,
  },
  {
    code: '541-01-00-00',
    name: 'Gastos de Depreciacion Edificios',
    allowsMovements: false,
  },
  {
    code: '541-01-00-00',
    aux: '001',
    name: 'Gastos de Depreciacion Edificios',
    allowsMovements: true,
  },
  {
    code: '541-02-00-00',
    name: 'Gastos Depreciacion Mejoras',
    allowsMovements: false,
  },
  {
    code: '541-02-00-00',
    aux: '001',
    name: 'Gastos de Depreciacion Mejoras',
    allowsMovements: true,
  },

  // Depreciación de Mobiliario y Equipos (542.xx.xx.xx)
  {
    code: '542-00-00-00',
    name: 'Gastos Depreciacion de Mobiliario y Equi',
    allowsMovements: false,
  },
  {
    code: '542-01-00-00',
    name: 'Gastos Depreciacion Mobiliario de Oficina',
    allowsMovements: false,
  },
  {
    code: '542-01-00-00',
    aux: '001',
    name: 'Gastos Depreciacion Mobiliario de Oficin',
    allowsMovements: true,
  },
  {
    code: '542-02-00-00',
    name: 'Gastos Depreciacion Equipo de Oficina',
    allowsMovements: false,
  },
  {
    code: '542-02-00-00',
    aux: '001',
    name: 'Gastos Depreciacion Equipo de Oficina',
    allowsMovements: true,
  },
  {
    code: '542-03-00-00',
    name: 'Gastos Depreciacion Equipos de Seguridad',
    allowsMovements: false,
  },
  {
    code: '542-04-00-00',
    name: 'Gastos Depreciacion Equipo de Computacion',
    allowsMovements: false,
  },
  {
    code: '542-04-00-00',
    aux: '001',
    name: 'Gastos Depreciacion Equipo de Computacion',
    allowsMovements: true,
  },
  {
    code: '542-09-00-00',
    name: 'Gastos Depreciacion Otros Equipos',
    allowsMovements: false,
  },

  // Depreciación de Transporte (542.99.xx.xx)
  {
    code: '542-99-00-00',
    name: 'Gastos Depreciacion Equipos de Transp',
    allowsMovements: false,
  },
  {
    code: '543-00-00-00',
    name: 'Gastos Depreciacion Vehiculos',
    allowsMovements: false,
  }, // Se asume 543.00.00.00 es Depreciación de Vehículos

  // Depreciación de Inmuebles Terminados y Turísticos (543.xx.xx.xx)
  {
    code: '543-02-00-00',
    name: 'Acumulada Equipos de',
    allowsMovements: false,
  }, // Nota: Texto incompleto, podría ser Depreciación Acumulada
  {
    code: '543-03-00-00',
    name: 'Inmuebles Terminados',
    allowsMovements: false,
  },
  { code: '543-03-01-00', name: 'Turisticas', allowsMovements: false },
  { code: '543-03-01-01', name: 'Edificaciones', allowsMovements: false },
  {
    code: '543-03-01-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '543-03-01-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '543-03-01-04', name: 'Vehiculos', allowsMovements: false },
  { code: '543-03-01-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '543-03-01-06', name: 'Mejoras', allowsMovements: false },
  { code: '543-03-02-00', name: 'Servicios', allowsMovements: false },
  { code: '543-03-02-01', name: 'Edificaciones', allowsMovements: false },
  {
    code: '543-03-02-02',
    name: 'Mobiliario y Equipos',
    allowsMovements: false,
  },
  {
    code: '543-03-02-03',
    name: 'Equipos de Computacion',
    allowsMovements: false,
  },
  { code: '543-03-02-04', name: 'Vehiculos', allowsMovements: false },
  { code: '543-03-02-05', name: 'Otros Equipos', allowsMovements: false },
  { code: '543-03-02-06', name: 'Mejoras', allowsMovements: false },

  // Depreciación de Bienes Diversos (544.xx.xx.xx)
  {
    code: '544-00-00-00',
    name: 'Gastos Depreciacion de Bienes Diversos',
    allowsMovements: false,
  },
  {
    code: '544-01-00-00',
    name: 'Gastos Depreciacion Otros Bienes en Alqu',
    allowsMovements: false,
  },
  {
    code: '544-99-00-00',
    name: 'Gastos Depreciacion Otros Bienes Diversos',
    allowsMovements: false,
  },

  // Amortización (545.xx.xx.xx - 546.xx.xx.xx)
  {
    code: '545-00-00-00',
    name: 'Gastos de Amortizacion de Primas Inversi',
    allowsMovements: false,
  },
  {
    code: '546-00-00-00',
    name: 'Gastos de Amortizacion de Gastos Diferid',
    allowsMovements: false,
  },
  {
    code: '546-01-00-00',
    name: 'Gastos de Amortizacion Compras de Licenc',
    allowsMovements: false,
  },
  {
    code: '546-01-00-00',
    aux: '001',
    name: 'Gastos Amortizacion Adquisicion Software',
    allowsMovements: true,
  },
  {
    code: '546-99-00-00',
    name: 'Gastos de Amortizacion Otros Gastos Dife',
    allowsMovements: false,
  },
  {
    code: '546-99-00-00',
    aux: '001',
    name: 'Gastos de Amortizacion Gastos Diferidos',
    allowsMovements: true,
  },
  {
    code: '546-99-00-00',
    aux: '002',
    name: 'Gtos. Amortizac. Liquidacion San Cristobal',
    allowsMovements: true,
  },

  // ESTIMACIONES (550.xx.xx.xx - INICIO)
  {
    code: '550-00-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },

  // Estimaciones para Préstamos (550.xx.xx.xx)
  {
    code: '550-00-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  }, // Se repite 550-00-00-00, siguiendo la imagen
  {
    code: '551-00-00-00',
    name: 'Para los Prestamos con Reserva de Dominio',
    allowsMovements: false,
  },

  // Estimaciones (550.xx.xx.xx - continuación)
  {
    code: '551-02-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '552-00-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '552-01-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '552-02-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },

  // Estimaciones Inmuebles Terminados y Turísticos (552.03.xx.xx)
  { code: '552-03-00-00', name: 'Turisticas', allowsMovements: false },
  { code: '552-03-01-00', name: 'Servicios', allowsMovements: false },

  // Estimaciones Inmuebles en Construcción (552.04.xx.xx)
  {
    code: '552-04-00-00',
    name: 'Para Inmuebles en Construccion',
    allowsMovements: false,
  },
  { code: '552-04-01-00', name: 'Turisticas', allowsMovements: false },
  { code: '552-04-02-00', name: 'Servicios', allowsMovements: false },

  // Estimaciones por Otras Inversiones (552.99.xx.xx)
  {
    code: '552-99-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '553-00-00-00',
    name: 'Para las Otras Inversiones',
    allowsMovements: false,
  },

  // Estimaciones por Intereses (553.xx.xx.xx)
  {
    code: '553-01-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '553-02-00-00',
    name: 'Intereses Devengados y no Cobrados Sobre',
    allowsMovements: false,
  },
  {
    code: '553-03-00-00',
    name: 'Rendimiento Devengado y no Cobrados Sob',
    allowsMovements: false,
  },

  // Estimaciones por Bienes (554.xx.xx.xx - 555.xx.xx.xx)
  {
    code: '554-00-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '554-01-00-00',
    name: 'Bienes Muebles Recuperados',
    allowsMovements: false,
  },
  {
    code: '554-02-00-00',
    name: 'Bienes Inmuebles Recuperados',
    allowsMovements: false,
  },
  {
    code: '555-00-00-00',
    name: 'Gastos por Constitucion de la Estimacion',
    allowsMovements: false,
  },
  {
    code: '555-01-00-00',
    name: 'Operaciones en Litigio',
    allowsMovements: false,
  },

  // GASTOS FINANCIEROS (560.xx.xx.xx) - INICIO
  { code: '560-00-00-00', name: 'Gastos Financieros', allowsMovements: false },

  // Gastos por Operaciones Bancarias (561.xx.xx.xx)
  {
    code: '561-00-00-00',
    name: 'Gastos por Operaciones Bancarias',
    allowsMovements: false,
  },
  {
    code: '561-01-00-00',
    name: 'Emision de Cheques de Gerencia',
    allowsMovements: false,
  },
  {
    code: '561-02-00-00',
    name: 'Por Transferencias Cuenta Corriente',
    allowsMovements: false,
  },
  {
    code: '561-03-00-00',
    name: 'Por Transferencias Cuenta de Ahorro',
    allowsMovements: false,
  },
  { code: '561-04-00-00', name: 'Estados de Cuenta', allowsMovements: false },
  {
    code: '561-05-00-00',
    name: 'Emision de Chequeras',
    allowsMovements: false,
  },
  {
    code: '561-06-00-00',
    name: 'Por Cheques Devueltos',
    allowsMovements: false,
  },
  {
    code: '561-07-00-00',
    name: 'Referencias Bancarias',
    allowsMovements: false,
  },

  // Otros Gastos Bancarios (561.99.xx.xx)
  {
    code: '561-99-00-00',
    name: 'Otros Gastos Bancarios',
    allowsMovements: false,
  },
  {
    code: '561-99-01-00',
    name: 'Gastos Bancarios x Venta Celular/Juguete',
    allowsMovements: false,
  },
  {
    code: '561-99-01-00',
    aux: '001',
    name: 'Gastos Bancarios x Venta Celular/Juguete',
    allowsMovements: true,
  },
  {
    code: '561-99-02-00',
    name: 'Provision Cuentas Incobrables',
    allowsMovements: false,
  },
  {
    code: '561-99-03-00',
    name: 'Otros Gastos Bancarios',
    allowsMovements: false,
  },
  {
    code: '561-99-03-00',
    aux: '002',
    name: 'Otros Gastos Bancarios',
    allowsMovements: true,
  },

  // OTROS GASTOS OPERATIVOS (570.xx.xx.xx) - INICIO
  {
    code: '570-00-00-00',
    name: 'Otros Gastos Operativos',
    allowsMovements: false,
  },

  // Gastos por Diferencias de Cambio (571.xx.xx.xx)
  {
    code: '571-00-00-00',
    name: 'Gastos por Diferencias de Cambio',
    allowsMovements: false,
  },
  {
    code: '571-01-00-00',
    name: 'Bancos e Instituciones Financieras',
    allowsMovements: false,
  },
  { code: '571-01-01-00', name: 'Cuentas Corrientes', allowsMovements: false },
  { code: '571-01-02-00', name: 'Cuentas de Ahorro', allowsMovements: false },
  {
    code: '571-01-03-00',
    name: 'Colocaciones Menores o Iguales a Noventa',
    allowsMovements: false,
  },
  {
    code: '571-01-04-00',
    name: 'Fideicomiso de Inversion',
    allowsMovements: false,
  },
  {
    code: '571-02-00-00',
    name: 'Cartera de Inversion',
    allowsMovements: false,
  },
  {
    code: '571-02-01-00',
    name: 'Bonos y Obligaciones de la Deuda Publica',
    allowsMovements: false,
  },
  {
    code: '571-02-02-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '571-02-03-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '571-02-04-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  },
  {
    code: '571-02-05-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  },
  {
    code: '571-02-99-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  },
  { code: '571-99-00-00', name: 'Otras Operaciones', allowsMovements: false },
  {
    code: '571-99-00-00',
    aux: '001',
    name: 'Ajuste Inventario Articulos Escolares',
    allowsMovements: true,
  },
  {
    code: '571-99-00-00',
    aux: '090',
    name: 'DONACIONES',
    allowsMovements: true,
  },
  {
    code: '571-99-00-00',
    aux: '092',
    name: 'Otros Gastos Ventas Asociados',
    allowsMovements: true,
  },

  // OTROS GASTOS OPERATIVOS (571.xx.xx.xx - continuación)
  {
    code: '571-99-00-00',
    aux: '093',
    name: 'Difer. CAMBIO FINANCIAM. Islas del Sol',
    allowsMovements: true,
  },
  {
    code: '571-99-00-00',
    aux: '094',
    name: 'Ganancia en Cambio',
    allowsMovements: true,
  },
  {
    code: '571-99-00-00',
    aux: '099',
    name: 'Otras Operaciones',
    allowsMovements: true,
  },

  // PÉRDIDA EN EL VALOR DE LAS INVERSIONES (572.xx.xx.xx)
  {
    code: '572-00-00-00',
    name: 'Perdida en el Valor de las Inversiones',
    allowsMovements: false,
  },
  {
    code: '572-01-00-00',
    name: 'Bonos y Obligaciones de la Deuda Publica',
    allowsMovements: false,
  },
  {
    code: '572-02-00-00',
    name: 'Bonos y Obligaciones de Organismos de la',
    allowsMovements: false,
  },
  {
    code: '572-03-00-00',
    name: 'Bonos y Obligaciones Emitidos por el Ban',
    allowsMovements: false,
  },
  {
    code: '572-04-00-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  },
  {
    code: '572-05-00-00',
    name: 'Bonos y Obligaciones Emitidos por Empres',
    allowsMovements: false,
  },
  {
    code: '572-99-00-00',
    name: 'Otras Inversiones en Titulos Valores',
    allowsMovements: false,
  },

  // PÉRDIDA POR INVERSIONES (573.xx.xx.xx)
  {
    code: '573-00-00-00',
    name: 'Perdida por Inversiones en Relacionadas',
    allowsMovements: false,
  },
  {
    code: '573-01-00-00',
    name: 'Perdida por Venta de las Inversiones en A',
    allowsMovements: false,
  },
  {
    code: '573-02-00-00',
    name: 'Perdida por Inversiones en Conjuntas',
    allowsMovements: false,
  },

  // OTRAS PÉRDIDAS (580.xx.xx.xx - 581.xx.xx.xx)
  { code: '580-00-00-00', name: 'Perdidas Eventuales', allowsMovements: false },
  { code: '581-00-00-00', name: 'Perdidas Eventuales', allowsMovements: false },

  // PÉRDIDA POR VENTA DE ACTIVOS (581.xx.xx.xx)
  { code: '581-01-00-00', name: 'Ventas de Activos', allowsMovements: false },
  { code: '581-02-00-00', name: 'Bienes', allowsMovements: false },
];

const rawAccounts6: RawAccount[] = [
  // CUENTAS DE ORDEN DEUDORAS (600.xx.xx.xx) - INICIO
  {
    code: '600-00-00-00',
    name: 'Cuentas de Orden Deudoras',
    allowsMovements: false,
  },
  {
    code: '610-00-00-00',
    name: 'Cuentas de Orden Deudoras',
    allowsMovements: false,
  }, // Se repite el nombre

  // Garantías Recibidas (611.xx.xx.xx)
  { code: '611-00-00-00', name: 'Garantias Recibidas', allowsMovements: false },
  { code: '611-01-00-00', name: 'Fianzas', allowsMovements: false },

  // Garantías Otorgadas (612.xx.xx.xx)
  { code: '612-00-00-00', name: 'Garantias Otorgadas', allowsMovements: false },
  { code: '612-01-00-00', name: 'Fianzas', allowsMovements: false },

  // Fondos Administrados (613.xx.xx.xx)
  {
    code: '613-00-00-00',
    name: 'Fondos Administrados',
    allowsMovements: false,
  },
  { code: '613-01-00-00', name: 'Montepio', allowsMovements: false },
  { code: '613-02-00-00', name: 'Mutuo Auxilio', allowsMovements: false },
  {
    code: '613-03-00-00',
    name: 'Prestaciones Sociales Fideicomiso',
    allowsMovements: false,
  },
  {
    code: '613-03-00-00',
    aux: '001',
    name: 'Fideicomiso Prestaciones Sociales',
    allowsMovements: true,
  },

  // Cuentas de Registro (614.xx.xx.xx)
  { code: '614-00-00-00', name: 'Cuentas de Registro', allowsMovements: false },
  {
    code: '614-01-00-00',
    name: 'Excedentes y Haberes no Reclamados',
    allowsMovements: false,
  },
  {
    code: '614-99-00-00',
    name: 'Otras Cuentas de Registro',
    allowsMovements: false,
  },
];

const rawAccounts7: RawAccount[] = [
  // Garantías Recibidas (711.xx.xx.xx)
  { code: '711-00-00-00', name: 'Garantias Recibidas', allowsMovements: false },
  { code: '711-01-00-00', name: 'Fianzas', allowsMovements: false },

  // Garantías Otorgadas (712.xx.xx.xx)
  { code: '712-00-00-00', name: 'Garantias Otorgadas', allowsMovements: false },
  { code: '712-01-00-00', name: 'Fianzas', allowsMovements: false },

  // Fondos Administrados (713.xx.xx.xx)
  {
    code: '713-00-00-00',
    name: 'Fondos Administrados',
    allowsMovements: false,
  },
  { code: '713-01-00-00', name: 'Montepio', allowsMovements: false },
  { code: '713-02-00-00', name: 'Mutuo Auxilio', allowsMovements: false },
  {
    code: '713-03-00-00',
    name: 'Prestaciones Sociales Fideicomiso',
    allowsMovements: false,
  },
  {
    code: '713-03-00-00',
    aux: '001',
    name: 'Fideicomiso Prestaciones Sociales',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '009',
    name: 'Retiro Capital Fideicomiso',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '031',
    name: 'MAIRA CAROLINA MEDINA',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '033',
    name: 'Luisana Carolina Colmenarez',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '039',
    name: 'MARLOURY YAÑEZ REY',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '040',
    name: 'MARTINEZ BETANCOURP LEONARDO',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '041',
    name: 'MAYERLING COROMORO PEÑA',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '042',
    name: 'JAVIER YSIDRO RINCON',
    allowsMovements: true,
  },
  {
    code: '713-03-00-00',
    aux: '043',
    name: 'JOSE LEONARDO CARILLO',
    allowsMovements: true,
  },
  { code: '714-00-00-00', name: 'Cuentas de Registro', allowsMovements: false },
  // Cuentas de Registro (714.xx.xx.xx - continuación)
  {
    code: '714-01-00-00',
    name: 'Excedentes y Haberes no Reclamados',
    allowsMovements: false,
  },
  {
    code: '714-99-00-00',
    name: 'Otras Cuentas de Registro',
    allowsMovements: false,
  },
];

export async function seedAllAccountPlanData(
  db: NodePgDatabase<typeof schema>,
) {
  try {
    console.log(
      'Iniciando el seeding del Plan de Cuentas (Datos unificados)...',
    );

    // 1. CONSOLIDAR TODOS LOS DATOS CRUDOS
    // Si necesitas los datos de las imágenes anteriores, debes importarlos y concatenarlos aquí.
    const allRawAccounts = [
      // Cuentas Nivel Raíz (si aún no se han agregado, se añaden aquí)
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
    const accountsToInsert = processAccounts(allRawAccounts);

    // 3. INSERCIÓN EN BASE DE DATOS
    const parentIdCache: { [key: string]: number } = {};

    for (const acc of accountsToInsert) {
      // Se asume que las cuentas padre ya fueron insertadas o ya existen.
      const parentAccountId = acc.parentCode
        ? parentIdCache[acc.parentCode] || null
        : null;

      const accountType = determineAccountType(acc.code);
      const nature = determineAccountNature(acc.code);

      const [insertedAccount] = await db
        .insert(accountPlan)
        .values({
          companyId: 1, // ID fijo
          code: acc.code,
          name: acc.name,
          description: acc.description,
          accountType: accountType as any,
          nature: nature as any,
          level: acc.level,
          allowsMovements: acc.allowsMovements,
          parentAccountId: parentAccountId,
          isActive: true,
          createdById: 1,
          updatedById: 1,
        })
        .onConflictDoNothing()
        .returning({ id: accountPlan.id, code: accountPlan.code });

      if (insertedAccount) {
        // Almacenar el ID de la cuenta insertada
        parentIdCache[acc.code] = insertedAccount.id;
      } else if (acc.code) {
        // Si ya existe (onConflictDoNothing), recuperamos su ID para que pueda ser padre
        const existingAccount = await db.query.accountPlan.findFirst({
          where: (ap, { eq }) => eq(ap.code, acc.code),
          columns: { id: true },
        });
        if (existingAccount) {
          parentIdCache[acc.code] = existingAccount.id;
        }
      }
    }

    console.log('Seeding completado para todas las imágenes.');
  } catch (error) {
    console.error('Error durante el seeding unificado:', error);
  }
}
