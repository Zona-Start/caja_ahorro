import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankMovementsService } from './bank-movements.service';
import {
  CreateBankMovementDto,
  LinkToInternalRecordDto,
  QueryBankMovementDto,
  UpdateBankMovementDto,
} from './dto';

@ApiTags('Banking')
@Controller('bank-movements')
export class BankMovementsController {
  constructor(private readonly bankMovementsService: BankMovementsService) {}

  @Post()
  @RequirePermissions('create:bank-movements')
  @ApiOperation({ summary: 'Create a new bank movement' })
  @ApiResponse({
    status: 201,
    description: 'Bank movement created successfully.',
  })
  create(
    @Req() req: Request,
    @Body() createBankMovementDto: CreateBankMovementDto,
  ) {
    const userId = req['user'].id;
    return this.bankMovementsService.create(createBankMovementDto, userId);
  }

  @Get()
  @RequirePermissions('read:bank-movements')
  @ApiOperation({ summary: 'List all bank movements' })
  @ApiResponse({ status: 200, description: 'A list of bank movements.' })
  findAll(@Query() query: QueryBankMovementDto) {
    return this.bankMovementsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('read:bank-movements')
  @ApiOperation({ summary: 'Get a bank movement by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found bank movement.',
  })
  @ApiResponse({ status: 404, description: 'Bank movement not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('update:bank-movements')
  @ApiOperation({ summary: 'Update a bank movement' })
  @ApiResponse({
    status: 200,
    description: 'Bank movement updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Bank movement not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBankMovementDto: UpdateBankMovementDto,
  ) {
    return this.bankMovementsService.update(id, updateBankMovementDto);
  }

  @Delete(':id')
  @RequirePermissions('delete:bank-movements')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bank movement' })
  @ApiResponse({
    status: 204,
    description: 'Bank movement deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Bank movement not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.remove(id);
  }

  // Endpoints for linking

  @Post(':id/link')
  @RequirePermissions('create:bank-movement-links')
  @ApiOperation({ summary: 'Link a bank transaction to an internal record' })
  @ApiResponse({ status: 201, description: 'Link created successfully.' })
  linkToInternalRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() linkDto: LinkToInternalRecordDto,
  ) {
    // TODO: Get userId from authenticated user
    const userId = 1; // Placeholder
    return this.bankMovementsService.linkToInternalRecord(id, linkDto, userId);
  }

  @Delete(':id/unlink')
  @RequirePermissions('delete:bank-movement-links')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink a bank transaction from an internal record',
  })
  @ApiResponse({ status: 204, description: 'Link removed successfully.' })
  unlinkFromInternalRecord(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.unlinkFromInternalRecord(id);
  }

  @Get(':id/link')
  @RequirePermissions('read:bank-movement-links')
  @ApiOperation({
    summary: 'Find the internal record linked to a bank transaction',
  })
  @ApiResponse({ status: 200, description: 'Link details found.' })
  findInternalLink(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.findInternalLink(id);
  }
}
