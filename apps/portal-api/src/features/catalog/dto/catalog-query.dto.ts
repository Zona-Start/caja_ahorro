import {
  byMunicipalityQuerySchema,
  byStateQuerySchema,
  resolveLocalityQuerySchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class ByStateQuery extends createZodDto(byStateQuerySchema) {}
export class ByMunicipalityQuery extends createZodDto(
  byMunicipalityQuerySchema,
) {}
export class ResolveLocalityQuery extends createZodDto(
  resolveLocalityQuerySchema,
) {}
