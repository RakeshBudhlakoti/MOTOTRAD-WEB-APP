import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public settings' })
  getPublic() {
    return this.settingsService.getPublicSettings();
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_SETTING')
  @ApiOperation({ summary: 'Get all settings (Admin)' })
  getAll() {
    return this.settingsService.getAllSettings();
  }

  @Post('bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_SETTING')
  @ApiOperation({ summary: 'Update multiple settings' })
  updateBulk(@Body() settings: Record<string, any>, @Req() req: any) {
    return this.settingsService.updateBulk(settings, req.user.sub);
  }

  @Get('db-stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get count of all deletable records (Superadmin Only)' })
  getDbStats(@Req() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Superadministrators can access database stats.');
    }
    return this.settingsService.getDbStats();
  }

  @Post('db-clean')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clean entire database except settings and superadmins (Superadmin Only)' })
  cleanDatabase(@Req() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Superadministrators are authorized to clean the database.');
    }
    return this.settingsService.cleanDatabase(req.user.sub);
  }
}
