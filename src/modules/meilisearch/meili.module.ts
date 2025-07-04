import { Module } from '@nestjs/common';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers/command';
import { MeilliService } from '@/modules/meilisearch/meili.service';

@Module({})
export class MeiliModule {
  static async forRoot(configure: Configure) {
    if (!configure.has('meili')) {
      panic({ message: 'MeilliSearch config not exists or not right!' });
    }
    return {
      global: true,
      module: MeiliModule,
      providers: [
        {
          provide: MeilliService,
          useFactory: async () => {
            const service = new MeilliService(await configure.get('meili'));
            service.createClients();
            return service;
          },
        },
      ],
      exports: [MeilliService],
    };
  }
}
