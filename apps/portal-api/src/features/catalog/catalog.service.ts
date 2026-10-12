import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

@Injectable()
export class CatalogService {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}

  async getStates() {
    return this.db
      .select({ id: schema.states.id, name: schema.states.name })
      .from(schema.states)
      .orderBy(asc(schema.states.name));
  }

  async getMunicipalities(stateId: number) {
    return this.db
      .select({
        id: schema.municipalities.id,
        name: schema.municipalities.name,
      })
      .from(schema.municipalities)
      .where(eq(schema.municipalities.stateId, stateId))
      .orderBy(asc(schema.municipalities.name));
  }

  async getParishes(municipalityId: number) {
    return this.db
      .select({ id: schema.parishes.id, name: schema.parishes.name })
      .from(schema.parishes)
      .where(eq(schema.parishes.municipalityId, municipalityId))
      .orderBy(asc(schema.parishes.name));
  }

  /** Resuelve el `localityId` a partir de estado + municipio + parroquia. */
  async resolveLocality(
    stateId: number,
    municipalityId: number,
    parishId: number,
  ) {
    const [row] = await this.db
      .select({
        id: schema.localities.id,
        name: schema.localities.name,
      })
      .from(schema.localities)
      .where(
        and(
          eq(schema.localities.stateId, stateId),
          eq(schema.localities.municipalityId, municipalityId),
          eq(schema.localities.parishId, parishId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        'No existe una localidad para el estado, municipio y parroquia indicados',
      );
    }
    return row;
  }
}
