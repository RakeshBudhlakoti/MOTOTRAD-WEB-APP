import { Module } from '@nestjs/common';
import { UploadService } from '@/modules/upload/upload.service';
import { UploadController } from '@/modules/upload/upload.controller';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }
