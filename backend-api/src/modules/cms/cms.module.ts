import { Module } from '@nestjs/common';
import { CmsService } from '@/modules/cms/cms.service';
import { CmsController } from '@/modules/cms/cms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
