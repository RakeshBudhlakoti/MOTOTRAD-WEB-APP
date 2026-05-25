import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as os from 'os';

// Auto-detect if running on AWS EC2 or production environment
const hostname = os.hostname().toLowerCase();
const isAWS = process.env.NODE_ENV === 'production' || hostname.includes('ec2') || hostname.includes('amazon') || !!process.env.AWS_EXECUTION_ENV;

if (isAWS && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:password@127.0.0.1:5432/mototrad?schema=public";
}

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn'],
  });

  // Redis Adapter for Scalable Websockets
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Security Headers
  app.use(helmet());
  app.enableCors();

  // API Versioning
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: process.env.API_VERSION || '1',
  });

  // Global Pipes & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Mototrad API')
    .setDescription('The Mototrad scalable backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5001;
  await app.listen(port);
  
  console.log('\n🚀 MOTOTRAD API IS READY');
  console.log(`📡 URL: http://localhost:${port}/api/v1`);
  console.log(`📝 DOCS: http://localhost:${port}/api/docs\n`);
}
bootstrap();
