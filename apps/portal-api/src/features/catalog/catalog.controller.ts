import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import {
  ByMunicipalityQuery,
  ByStateQuery,
  ResolveLocalityQuery,
} from './dto/catalog-query.dto';

@ApiTags('catálogos')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('states')
  @ApiOperation({ summary: 'Estados' })
  states() {
    return this.catalog.getStates();
  }

  @Get('municipalities')
  @ApiOperation({ summary: 'Municipios por estado' })
  municipalities(@Query() query: ByStateQuery) {
    return this.catalog.getMunicipalities(query.stateId);
  }

  @Get('parishes')
  @ApiOperation({ summary: 'Parroquias por municipio' })
  parishes(@Query() query: ByMunicipalityQuery) {
    return this.catalog.getParishes(query.municipalityId);
  }

  @Get('localities/resolve')
  @ApiOperation({
    summary: 'Resolver localityId desde estado + municipio + parroquia',
  })
  resolve(@Query() query: ResolveLocalityQuery) {
    return this.catalog.resolveLocality(
      query.stateId,
      query.municipalityId,
      query.parishId,
    );
  }
}
