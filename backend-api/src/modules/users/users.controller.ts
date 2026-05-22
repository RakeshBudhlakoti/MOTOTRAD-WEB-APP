import { Controller, Get, Post, UseGuards, Req, Patch, Body, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- STATIC GET ROUTES ---
  @Get('check-availability')
  @ApiOperation({ summary: 'Check if email or username is available' })
  checkAvailability(@Query('type') type: 'email' | 'username', @Query('value') value: string) {
    return this.usersService.checkAvailability(type, value);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getProfile(user.sub);
  }

  @Get('my-bids')
  @ApiOperation({ summary: 'Get current user bids' })
  getMyBids(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getMyBids(user.sub);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  getMyOrders(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getMyOrders(user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'operations', 'support')
  @ApiOperation({ summary: 'Admin: List all users' })
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  // --- STATIC PATCH ROUTES ---
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Req() req: Request, @Body() data: any) {
    const user = req.user as any;
    return this.usersService.updateProfile(user.sub, data);
  }

  // --- STATIC POST ROUTES ---
  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin: Create new user' })
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  // --- DYNAMIC ROUTES (WILDCARDS) ---
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'operations')
  @ApiOperation({ summary: 'Admin: Get single user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'operations')
  @ApiOperation({ summary: 'Admin: Update user' })
  update(@Param('id') id: string, @Body() data: any, @Req() req: Request) {
    const actor = req.user as any;
    return this.usersService.update(id, data, actor);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'operations')
  @ApiOperation({ summary: 'Admin: Update user status' })
  updateStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', @Req() req: Request) {
    const actor = req.user as any;
    return this.usersService.updateStatus(id, status, actor);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin: Delete user' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const actor = req.user as any;
    return this.usersService.remove(id, actor);
  }

  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin: Restore soft-deleted user' })
  restore(@Param('id') id: string, @Req() req: Request) {
    const actor = req.user as any;
    return this.usersService.restore(id, actor);
  }
}
