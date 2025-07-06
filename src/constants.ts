import { existsSync } from 'node:fs';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { isNil, join } from 'lodash';

import { ContentModule } from '@/modules/content/content.module';
import { CreateOptions } from '@/modules/core/types';
import { DatabaseModule } from '@/modules/database/database.module';

import { MeiliModule } from '@/modules/meilisearch/meili.module';

import { Restful } from '@/modules/restful/restful';
import { RestfulModule } from '@/modules/restful/restful.module';

import * as configs from './config';
import { ApiConfig } from './modules/restful/types';

export const createOptions: CreateOptions = {
  // configs:config目录下的配置,比如key是"database",value是database函数
  config: { factories: configs as any, storage: { enabled: true } },
  modules: async (configure) => [
    DatabaseModule.forRoot(configure),
    MeiliModule.forRoot(configure),
    ContentModule.forRoot(configure),
    RestfulModule.forRoot(configure),
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

    if (!isNil(await configure.get<ApiConfig>('api', null))) {
      const restful = container.get(Restful);
      /**
       * 判断是否存在metadata模块,存在的话则加载并传入factoryDocs
       */
      let metadata: () => Promise<Record<string, any>>;
      if (existsSync(join(__dirname, 'metadata.js'))) {
        metadata = (await import(join(__dirname, 'metadata.js'))).default;
      }
      if (existsSync(join(__dirname, 'metadata.ts'))) {
        metadata = (await import(join(__dirname, 'metadata.ts'))).default;
      }
      await restful.factoryDocs(container, metadata);
    }

    return container;
  },
};
