import { PartialType } from '@nestjs/swagger';
import { CreateCategoryTypeDto } from './create-category-type.dto';

export class UpdateCategoryTypeDto extends PartialType(CreateCategoryTypeDto) {}