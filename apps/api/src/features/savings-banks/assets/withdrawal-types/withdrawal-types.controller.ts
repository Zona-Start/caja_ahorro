import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateWithdrawalTypeDto } from './dto/create-withdrawal-type.dto';
import { UpdateWithdrawalTypeDto } from './dto/update-withdrawal-type.dto';
import { WithdrawalTypesService } from './withdrawal-types.service';

@ApiTags('savings-banks/withdrawal-types')
@Controller('savings-banks/withdrawal-types')
export class WithdrawalTypesController {
  constructor(
    private readonly withdrawalTypesService: WithdrawalTypesService,
  ) {}

  @Post()
  @RequirePermissions('create:withdrawal-types')
  @ApiOperation({ summary: 'Create a new withdrawal type' })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal type successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'A withdrawal type with this description already exists.',
  })
  create(
    @Req() req: Request,
    @Body() createWithdrawalTypeDto: CreateWithdrawalTypeDto,
  ) {
    const userdId = req['user'].id;
    return this.withdrawalTypesService.create(createWithdrawalTypeDto, userdId);
  }

  @Get('/paginated')
  @RequirePermissions('read:withdrawal-types')
  @ApiOperation({ summary: 'Get all withdrawal types' })
  @ApiResponse({ status: 200, description: 'List of withdrawal types.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.withdrawalTypesService.findAll(paginationDto);
  }

  @Get(':id')
  @RequirePermissions('read:withdrawal-types')
  @ApiOperation({ summary: 'Get a withdrawal type by ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal type found.' })
  @ApiResponse({ status: 404, description: 'Withdrawal type not found.' })
  findOne(@Param('id') id: string) {
    return this.withdrawalTypesService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('update:withdrawal-types')
  @ApiOperation({ summary: 'Update a withdrawal type by ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal type updated.' })
  @ApiResponse({ status: 404, description: 'Withdrawal type not found.' })
  update(
    @Param('id') id: string,
    @Body() updateWithdrawalTypeDto: UpdateWithdrawalTypeDto,
    @Req() req: Request,
  ) {
    const userdId = req['user'].id;
    return this.withdrawalTypesService.update(
      +id,
      updateWithdrawalTypeDto,
      userdId,
    );
  }

  @Delete(':id')
  @RequirePermissions('delete:withdrawal-types')
  @ApiOperation({ summary: 'Delete a withdrawal type by ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal type deleted.' })
  @ApiResponse({ status: 404, description: 'Withdrawal type not found.' })
  remove(@Param('id') id: string) {
    return this.withdrawalTypesService.remove(+id);
  }
}
