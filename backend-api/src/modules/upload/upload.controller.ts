import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a presigned S3 URL for secure file upload' })
  getPresignedUrl(
    @Body('fileName') fileName: string,
    @Body('fileType') fileType: string,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.getPresignedUrl(fileName, fileType, folder);
  }
}
