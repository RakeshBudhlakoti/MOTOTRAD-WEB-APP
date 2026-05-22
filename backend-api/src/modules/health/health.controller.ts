import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator
} from '@nestjs/terminus';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';
import { S3HealthIndicator } from './indicators/s3.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
    private redis: RedisHealthIndicator,
    private s3: S3HealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check all infrastructure and server dependencies' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
      () => this.redis.isHealthy('redis'),
      () => this.s3.isHealthy('s3'),
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024), // 500MB for dev
      () => this.disk.checkStorage('storage', { path: 'C:\\', thresholdPercent: 0.9 }), // Windows path
    ]);
  }
}
