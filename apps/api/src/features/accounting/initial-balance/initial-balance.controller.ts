
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitialLoadDto } from './dto/initial-load.dto';
import { InitialBalanceService } from './initial-balance.service';

@ApiTags('initial-balance')
@Controller('initial-balance')
export class InitialBalanceController {
  constructor(private readonly initialBalanceService: InitialBalanceService) {}

  @Post('initial-load')
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:initial-balance')
  @ApiOperation({ summary: 'Load initial balances for an accounting cycle' })
  @ApiResponse({
    status: 201,
    description: 'Initial balances loaded successfully.',
  })
  async initialLoad(
    @Req() req: Request,
    @Body() initialLoadDto: InitialLoadDto,
  ) {
    const userId = req['user'].id;
    const data = await this.initialBalanceService.initialLoad(
      userId,
      initialLoadDto,
    );
    return { message: 'Initial balances loaded successfully', data };
  }
}
