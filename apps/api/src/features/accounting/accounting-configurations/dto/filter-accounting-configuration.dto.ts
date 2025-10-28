import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountingConfigurationDto extends PartialType(PaginationDto) {}
