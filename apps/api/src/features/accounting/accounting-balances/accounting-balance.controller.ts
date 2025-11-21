import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountingBalanceService } from './accounting-balance.service';
import { CloseCycleDto } from './dto/close-cycle.dto';
import { FilterAccountingBalanceDto } from './dto/filter-accounting-balance.dto';
import { InitialLoadDto } from './dto/initial-load.dto';
import { OpenCycleDto } from './dto/open-cycle.dto';

@ApiTags('accounting-balance')
@Controller('accounting-balance')
export class AccountingBalanceController {
  constructor(
    private readonly accountingBalanceService: AccountingBalanceService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  @RequirePermissions('read:accounting-balance')
  @ApiOperation({ summary: 'Get accounting balances paginated' })
  async findAll(@Query() filterDto: FilterAccountingBalanceDto) {
    return await this.accountingBalanceService.findAllPaginated(filterDto);
  }

  @Post('bootstrapping')
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:initial-balance')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Load initial balances (Bootstrapping)',
    description:
      'Acepta datos en formato JSON (balances array) o archivo Excel con columnas: cuenta, descripcion, saldo',
  })
  @ApiResponse({
    status: 201,
    description: 'Bootstrapping completed successfully.',
  })
  async bootstrapping(
    @Req() req: Request,
    @Body() initialLoadDto: InitialLoadDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req['user'].id;
    return await this.accountingBalanceService.bootstrapping(
      userId,
      initialLoadDto,
      file,
    );
  }

  @Post('close/:id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('update:accounting-cycle') // Assuming permission exists
  @ApiOperation({ summary: 'Close an accounting cycle (Snapshot)' })
  @ApiResponse({
    status: 200,
    description: 'Cycle closed successfully.',
  })
  async closeCycle(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() closeCycleDto: CloseCycleDto,
  ) {
    const userId = req['user'].id;
    return await this.accountingBalanceService.closeCycle(
      userId,
      +id,
      closeCycleDto,
    );
  }

  @Post('open')
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:accounting-cycle') // Assuming permission exists
  @ApiOperation({ summary: 'Open a new accounting cycle (Roll-forward)' })
  @ApiResponse({
    status: 201,
    description: 'New cycle opened successfully.',
  })
  async openCycle(@Req() req: Request, @Body() openCycleDto: OpenCycleDto) {
    const userId = req['user'].id;
    return await this.accountingBalanceService.openCycle(userId, openCycleDto);
  }
}
