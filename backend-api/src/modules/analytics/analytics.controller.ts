import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('VIEW_REPORTS')
  @ApiOperation({ summary: 'Admin: Get platform statistics' })
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getAdminStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('dashboard-overview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('VIEW_REPORTS')
  @ApiOperation({ summary: 'Admin: Get dynamic dashboard overview data' })
  getDashboardOverview() {
    return this.analyticsService.getDashboardOverview();
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('VIEW_AUDIT_LOGS')
  @ApiOperation({ summary: 'Admin: Get platform audit logs' })
  getAuditLogs(@Query() query: any) {
    return this.analyticsService.getAuditLogs(query);
  }

  @Get('export/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('VIEW_REPORTS')
  @ApiOperation({ summary: 'Export orders to CSV' })
  async exportOrders(@Res() res: any) {
    const csv = await this.analyticsService.exportOrdersCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('orders-report.csv');
    return res.send(csv);
  }
}
