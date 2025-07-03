import { Module } from '@nestjs/common';

// 通过导入database.configt.ts所在目录就可以使用了
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppFilter } from '@/modules/core/providers/app.filter';
import { AppIntercepter } from '@/modules/core/providers/app.interceptor';
import { AppPipe } from '@/modules/core/providers/app.pipe';

import { MeilliModule } from '@/modules/meilisearch/meili.module';

import { content, database, meili } from './config';
import { ContentModule } from './modules/content/content.module';
import { CoreModule } from './modules/core/core.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
  imports: [
    ContentModule.forRoot(content),
    // 在导入模块时,如果需要传入参数,可以将该模块声明为动态模块
    CoreModule.forRoot(),
    // 对于TypeormModule的forRoot的导入,放在了DatabaseModule
    DatabaseModule.forRoot(database),
    MeilliModule.forRoot(meili),
  ],
  providers: [
    {
      // 通过指定token为app_pipe来注册全局验证管道
      provide: APP_PIPE,
      useValue: new AppPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AppIntercepter,
    },
    {
      provide: APP_FILTER,
      useClass: AppFilter,
    },
  ],
})
export class AppModule {}
