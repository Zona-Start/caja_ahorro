import { Roles } from '@/common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { State } from './entities/state.entity';
import { StatesService } from './states.service';

@ApiTags('States')
@Controller('core/states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get all states' })
  @ApiResponse({ status: 200, description: 'Return all states', type: [State] })
  findAll() {
    return this.statesService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get a state by id' })
  @ApiResponse({ status: 200, description: 'Return a state', type: State })
  @ApiResponse({ status: 404, description: 'State not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.statesService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new state' })
  @ApiResponse({ status: 201, description: 'State created', type: State })
  create(@Body() createStateDto: CreateStateDto) {
    return this.statesService.create(createStateDto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a state' })
  @ApiResponse({ status: 200, description: 'State updated', type: State })
  @ApiResponse({ status: 404, description: 'State not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStateDto: UpdateStateDto,
  ) {
    return this.statesService.update(id, updateStateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a state' })
  @ApiResponse({ status: 200, description: 'State deleted' })
  @ApiResponse({ status: 404, description: 'State not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.statesService.remove(id);
  }
}
