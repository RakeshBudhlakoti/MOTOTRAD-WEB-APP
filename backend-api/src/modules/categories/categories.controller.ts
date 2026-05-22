import { Controller, Post, Get, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Create a new category' })
  create(@Body() data: any) {
    return this.categoriesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get categories with optional search and pagination' })
  findAll(
    @Query('includePastCount') includePastCount?: boolean,
    @Query('includeActiveCount') includeActiveCount?: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tree') tree?: boolean,
  ) {
    return this.categoriesService.findAll({
      includePastCount: Boolean(includePastCount),
      includeActiveCount: Boolean(includeActiveCount),
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      tree: Boolean(tree),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID with attributes' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Update category' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CATALOG')
  @ApiOperation({ summary: 'Admin: Deactivate category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
