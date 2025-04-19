import { PartialType } from '@nestjs/swagger';
import { CreateAssociateDto } from './create-associate.dto';

export class UpdateAssociateDto extends PartialType(CreateAssociateDto) {}