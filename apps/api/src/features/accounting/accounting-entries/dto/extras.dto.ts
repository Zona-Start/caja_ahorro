import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Ejemplo de uno de ellos (crea los demás iguales)
export class GenerateOpeningDto {
  @IsInt() accountingCycleId: number;
  @IsDate() entryDate: Date;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances: BalanceDto[];
}
export class BalanceDto {
  @IsInt() accountPlanId: number;
  @IsNumber({ maxDecimalPlaces: 6 }) amount: number;
}

export class CloseMonthDto {
  @IsInt()
  accountingCycleId: number;

  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @IsInt()
  resultAccountId: number;
}

class DepreciationLine {
  @IsInt() assetAccountId: number;
  @IsInt() expenseAccountId: number;
  @IsNumber({ maxDecimalPlaces: 6 }) amount: number;
}

export class DepreciationDto {
  @IsInt()
  accountingCycleId: number;

  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepreciationLine)
  lines: DepreciationLine[];
}

class ReconciliationItem {
  @IsInt() accountId: number;
  @IsNumber({ maxDecimalPlaces: 6 }) amount: number;
  @IsOptional() @IsString() description?: string;
}

export class BankReconciliationDto {
  @IsInt()
  accountingCycleId: number;

  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconciliationItem)
  items: ReconciliationItem[];
}

class InventoryItem {
  @IsInt() inventoryAccountId: number;
  @IsInt() expenseAccountId: number;
  @IsNumber({ maxDecimalPlaces: 6 }) qty: number;
  @IsNumber({ maxDecimalPlaces: 6 }) unitCost: number;
}

export class InventoryAdjustDto {
  @IsInt()
  accountingCycleId: number;

  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItem)
  items: InventoryItem[];
}

class TaxItem {
  @IsInt() expenseAccountId: number;
  @IsInt() taxPayableAccountId: number;
  @IsNumber({ maxDecimalPlaces: 6 }) amount: number;
}

export class TaxProvisionDto {
  @IsInt()
  accountingCycleId: number;

  @IsDate()
  @Type(() => Date)
  entryDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxItem)
  items: TaxItem[];
}
