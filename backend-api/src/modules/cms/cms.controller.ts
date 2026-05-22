import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from '@/modules/cms/cms.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get a public page by slug' })
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug);
  }

  @Get('banners')
  @ApiOperation({ summary: 'Get active banners' })
  getBanners(@Query('position') position?: string) {
    return this.cmsService.getBanners(position);
  }

  @Get('faqs')
  @ApiOperation({ summary: 'Get active FAQs' })
  getFaqs(@Query('category') category?: string) {
    return this.cmsService.getFaqs(category);
  }

  @Post('pages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CMS')
  @ApiOperation({ summary: 'Admin: Create a new page' })
  createPage(@Body() data: any) {
    return this.cmsService.createPage(data);
  }

  @Patch('pages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('MANAGE_CMS')
  @ApiOperation({ summary: 'Admin: Update a page' })
  updatePage(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updatePage(id, data);
  }
}
