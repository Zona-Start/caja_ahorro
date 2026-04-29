export const CATEGORY_TYPES = {
  ASSOCIATE_TYPE: "associate_type",
  DISCOUNT_FREQUENCY: "discount_frequency",
  PAYROLL_TYPE: "payroll_type",
  NATIONALITY: "nationality",
  GENDER: "gender",
  DOCUMENT_TYPE: "document_type",
  CIVIL_STATUS: "civil_status",
  ACCOUNT_TYPE: "account_type",
  TRANSACTION_TYPE: "transaction_type",
} as const;

export const CategoriesSeed = [
  // associate_type
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "empleados",
    name: "Empleados",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "gerencia",
    name: "Nivel Gerencial",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "pensionados",
    name: "Pensionados",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "jubilados",
    name: "Jubilados",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "ejecutivo",
    name: "Nivel Ejecutivo",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "comision_servicio",
    name: "Personal en Comisión de Servicio",
  },
  {
    type: CATEGORY_TYPES.ASSOCIATE_TYPE,
    code: "contratado",
    name: "Personal Contratado a Tiempo Determinado",
  },

  // discount_frequency
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "semanal",
    name: "Semanal",
  },
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "quincenal",
    name: "Quincenal",
  },
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "mensual",
    name: "Mensual",
  },
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "trimestral",
    name: "Trimestral",
  },
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "semestral",
    name: "Semestral",
  },
  {
    type: CATEGORY_TYPES.DISCOUNT_FREQUENCY,
    code: "anual",
    name: "Anual",
  },

  // payroll_type
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5501",
    name: "Aporte Empleados",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5800",
    name: "Descuentos Caja",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5502",
    name: "Prestamos Personales",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5504",
    name: "Prestamos Hipotecarios",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5508",
    name: "Credito Moto",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },

  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5518",
    name: "Prestamos Afianzados",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5559",
    name: "Credito Vehiculo",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5634",
    name: "Prestamos Mediano Plazo",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5635",
    name: "Prestamos a Largo Plazo",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "0059",
    name: "Reintegro Caja",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "0020",
    name: "Reintegro Prestamo",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5594",
    name: "Credito Telefono",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5027",
    name: "Credito Jornada Salud",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5025",
    name: "Credito Comercial",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },
  {
    type: CATEGORY_TYPES.PAYROLL_TYPE,
    code: "5022",
    name: "Credi Salario",
    metadata: {
      deferredDate: "2025-09-30",
      dateCanceled: "2023-10-31",
      deferredNumber: "81",
      numberCanceled: "91",
      group: "ASSETS",
    },
  },

  // nationality
  { type: CATEGORY_TYPES.NATIONALITY, code: "V", name: "Venezolano" },
  { type: CATEGORY_TYPES.NATIONALITY, code: "E", name: "Extranjero" },

  // gender
  { type: CATEGORY_TYPES.GENDER, code: "M", name: "Masculino" },
  { type: CATEGORY_TYPES.GENDER, code: "F", name: "Femenino" },

  // civil_status
  { type: CATEGORY_TYPES.CIVIL_STATUS, code: "soltero", name: "Soltero" },
  { type: CATEGORY_TYPES.CIVIL_STATUS, code: "casado", name: "Casado" },
  {
    type: CATEGORY_TYPES.CIVIL_STATUS,
    code: "divorciado",
    name: "Divorciado",
  },
  { type: CATEGORY_TYPES.CIVIL_STATUS, code: "viudo", name: "Viudo" },

  // account_type
  { type: CATEGORY_TYPES.ACCOUNT_TYPE, code: "corriente", name: "Corriente" },
  { type: CATEGORY_TYPES.ACCOUNT_TYPE, code: "ahorro", name: "Ahorro" },
];
