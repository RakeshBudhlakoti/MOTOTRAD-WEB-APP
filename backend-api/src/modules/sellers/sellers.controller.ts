import { Controller, Post, Get, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SellersService } from '@/modules/sellers/sellers.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}
  
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: List all sellers' })
  findAll() {
    return this.sellersService.findAll();
  }

  @Post('register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register as a seller' })
  register(@Req() req: any, @Body() data: any) {
    return this.sellersService.registerSeller(req.user.sub, data);
  }

  @Post('kyc')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit KYC documents' })
  submitKyc(@Req() req: any, @Body() data: any) {
    // In real app, first find sellerId from userId
    return this.sellersService.submitKyc(data.sellerId, data);
  }

  @Patch('kyc/:id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('APPROVE_SELLER')
  @ApiOperation({ summary: 'Admin: Approve seller KYC' })
  approveKyc(@Param('id') kycId: string, @Req() req: any) {
    return this.sellersService.approveKyc(kycId, req.user.sub);
  }

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get seller dashboard data' })
  getDashboard(@Req() req: any) {
    // In real app, first find sellerId from userId
    return this.sellersService.getSellerDashboard(req.query.sellerId as string);
  }
}
