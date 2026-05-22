import { Module } from '@nestjs/common';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CategoriesController } from '@/modules/categories/categories.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
