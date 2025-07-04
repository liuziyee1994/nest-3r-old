import { DynamicModule, Module } from '@nestjs/common';

import { Configure } from '@/modules/config/configure';

@Module({})
export class CoreModule {
  // async函数的返回类型一定是Promise<T>
  static async forRoot(configure: Configure): Promise<DynamicModule> {
    await configure.store('app.name');
    return {
      module: CoreModule,
      global: true,
      providers: [],
      exports: [],
    };
  }
}
