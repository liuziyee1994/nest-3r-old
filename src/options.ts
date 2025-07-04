import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { ContentModule } from '@/modules/content/content.module';
import { CreateOptions } from '@/modules/core/types';
import { DatabaseModule } from '@/modules/database/database.module';

import { MeiliModule } from '@/modules/meilisearch/meili.module';

import * as configs from './config';

export const createOptions: CreateOptions = {
  // configs:config目录下的配置,比如key是"database",value是database函数
  config: { factories: configs as any, storage: { enabled: true } },
  modules: async (configure) => [
    DatabaseModule.forRoot(configure),
    MeiliModule.forRoot(configure),
    ContentModule.forRoot(configure),
  ],
  globals: {},
  builder: async ({ configure, BootModule }) => {
    const container = await NestFactory.create<NestFastifyApplication>(
      BootModule,
      new FastifyAdapter(),
      {
        cors: true,
        logger: ['error', 'warn'],
      },
    );
    return container;
  },
};
