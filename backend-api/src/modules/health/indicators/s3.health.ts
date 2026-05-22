import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3HealthIndicator extends HealthIndicator {
  private s3: S3Client;
  private bucketName: string;

  constructor() {
    super();
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      return this.getStatus(key, true);
    } catch (error) {
      console.error('[S3HealthIndicator] Connection failed:', error.message);
      throw new HealthCheckError('S3 connection failed', this.getStatus(key, false, { message: error.message }));
    }
  }
}
