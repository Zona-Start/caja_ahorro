import { PartialType } from '@nestjs/swagger';
import { CreateSavingsBankDto } from './create-savings-bank.dto';

export class UpdateSavingsBankDto extends PartialType(CreateSavingsBankDto) {}