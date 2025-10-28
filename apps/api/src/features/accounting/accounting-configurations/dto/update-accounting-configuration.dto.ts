import { PartialType } from '@nestjs/swagger';
import { CreateAccountingConfigurationDto } from './create-accounting-configuration.dto';

export class UpdateAccountingConfigurationDto extends PartialType(CreateAccountingConfigurationDto) {}
