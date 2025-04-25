import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssociateAccountsService } from './associate-accounts.service';
import { UpdateAssociateAccountsDto } from './dto/update-associate-accounts.dto';

@ApiTags('savings-banks/associate-accounts')
@Controller('savings-banks/associatess')
export class AssociateAccountsController {
  constructor(
    private readonly associateAccountsService: AssociateAccountsService,
  ) {}

  @Get('/cuentas/:id')
  @Roles('admin')
  @RequirePermissions('read:associate-accounts')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiResponse({ status: 200, description: 'Return the account.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.associateAccountsService.findOne(+id);
    return { message: 'Associate Account fetched successfully', data };
  }

  @Patch('/cuentas/:id')
  @Roles('admin')
  @RequirePermissions('update:associate-accounts')
  @ApiOperation({ summary: 'Update an associate account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Associate Accounts updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Associate Accounts not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAssociateAccountsDto: UpdateAssociateAccountsDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associateAccountsService.update(
      userdId,
      +id,
      updateAssociateAccountsDto,
    );
    return { message: 'Associate Accounts updated successfully', data };
  }
}
