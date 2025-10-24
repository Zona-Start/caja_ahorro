import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAssociatedDebtsDto } from '../dto/get-associated-debts.dto';
import { ReportsAssociatedDebtsService } from '../services/reports-associated-debts.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsAssociatedDebtsController {
  constructor(private readonly service: ReportsAssociatedDebtsService) {}

  @Get('associated-debts')
  @RequirePermissions('read:reports-associated-debts')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({
    status: 200,
    description: 'Excel file with associated debts',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  async downloadAssociatedDebts(
    @Query() dto: GetAssociatedDebtsDto,
  ): Promise<StreamableFile> {
    return this.service.getAssociatedDebtsStream(dto);
  }
}
