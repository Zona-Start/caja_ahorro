// src/liquidations/entities/liquidation.entity.ts (o donde definas tus esquemas Drizzle)

import { liquidationsAssociates } from '@/database';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
// Ajusta la ruta a tu esquema de tabla

// Tipo para los datos que se insertarán en la tabla
export type InsertLiquidation = InferInsertModel<typeof liquidationsAssociates>;

// Tipo para los datos que se seleccionarán de la tabla
export type SelectLiquidation = InferSelectModel<typeof liquidationsAssociates>;

// También puedes exportar la tabla directamente si no lo haces ya en otro lugar
export { liquidationsAssociates };
