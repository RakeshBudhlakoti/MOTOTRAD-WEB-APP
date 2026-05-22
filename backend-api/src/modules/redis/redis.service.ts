import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('error', (err) => {
      console.error('[RedisService] Error:', err.message);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: any, ttl?: number) {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, data, 'EX', ttl);
    } else {
      await this.client.set(key, data);
    }
  }

  async get(key: string) {
    const data = await this.client.get(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return data;
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async lock(key: string, ttl: number = 5000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.client.set(lockKey, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async unlock(key: string) {
    await this.client.del(`lock:${key}`);
  }
}
