import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndividualLoadDto } from './dto/create-individual-load.dto';
import { IndividualLoadService } from './individual-load.service';

@ApiTags('savings-banks/individual-load')
@Controller('savings-banks/individual-load')
export class IndividualLoadController {
  constructor(private readonly individualLoadService: IndividualLoadService) {}

  @Post()
  @RequirePermissions('create:individual-load')
  @ApiOperation({ summary: 'Create a new individual Load' })
  @ApiResponse({
    status: 201,
    description: 'Individual Load successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'A individual load with this description already exists.',
  })
  create(@Req() req: Request, @Body() individualLoadDto: IndividualLoadDto) {
    const userdId = req['user'].id;
    return this.individualLoadService.create(individualLoadDto, userdId);
  }
}
