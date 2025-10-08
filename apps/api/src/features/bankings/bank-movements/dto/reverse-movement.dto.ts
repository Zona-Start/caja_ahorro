// src/modules/bank-movements/dto/reverse-movement.dto.ts
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReverseMovementDto {
  @IsDateString()
  valueDate!: string; // fecha valor de la reversa (normalmente hoy o día siguiente)

  @IsString()
  @IsOptional()
  reason?: string; // motivo de la reversa (opcional)
}
