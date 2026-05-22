import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BasketsService } from './baskets.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('baskets')
@Controller('baskets')
export class BasketsController {
  constructor(private readonly basketsService: BasketsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Create a new basket' })
  create(@Body() data: any) {
    return this.basketsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all baskets with search, pagination, and status filter' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: string,
  ) {
    return this.basketsService.findAll({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a basket by ID or slug' })
  findOne(@Param('id') id: string) {
    return this.basketsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Update basket' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.basketsService.update(id, data);
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Toggle basket active/inactive status' })
  toggleStatus(@Param('id') id: string) {
    return this.basketsService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Delete basket (unassigns products first)' })
  remove(@Param('id') id: string) {
    return this.basketsService.remove(id);
  }
}
