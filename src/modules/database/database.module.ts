import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  getDataSourceToken,
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import { DataSource, ObjectType } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers/command';
import { UniqueExistConstraint } from '@/modules/database/constraints';
import { DataExistConstraint } from '@/modules/database/constraints/data.exist.constraint';
import { UniqueTreeConstraint } from '@/modules/database/constraints/tree.unique.constraint';
import { UniqueTreeExistConstraint } from '@/modules/database/constraints/tree.unique.exist.constraint';
import { UniqueConstraint } from '@/modules/database/constraints/unique.constraint';

import { DbOptions } from '@/modules/database/types';

import { CUSTOM_REPOSITORY_METADATA } from './constants';

@Module({})
export class DatabaseModule {
  static async forRoot(configure: Configure) {
    if (!configure.has('database')) {
      panic({ message: 'Database config not exists or not right!' });
    }
    const { connections } = await configure.get<DbOptions>('database');

    console.log('数据库配置:', JSON.stringify(connections));

    const imports: ModuleMetadata['imports'] = [];
    for (const dbOption of connections) {
      imports.push(TypeOrmModule.forRoot(dbOption as TypeOrmModuleOptions));
    }
    const providers: ModuleMetadata['providers'] = [
      DataExistConstraint,
      UniqueConstraint,
      UniqueExistConstraint,
      UniqueTreeConstraint,
      UniqueTreeExistConstraint,
    ];

    return {
      global: true,
      module: DatabaseModule,
      imports,
      providers,
    };
  }

  /**
   * 用来注册自定义repository的函数
   */
  static forRepository<T extends Type<any>>(
    repositories: T[],
    dataSourceName?: string,
  ): DynamicModule {
    // todo:这里在了解更多typeorm后,重新看下代码和文档
    const providers: Provider[] = [];

    for (const Repo of repositories) {
      const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);

      if (!entity) {
        continue;
      }

      providers.push({
        inject: [getDataSourceToken(dataSourceName)],
        provide: Repo,
        useFactory: (dataSource: DataSource): InstanceType<typeof Repo> => {
          // 通过entity生成默认的repository实例
          const base = dataSource.getRepository<ObjectType<any>>(entity);
          return new Repo(base.target, base.manager, base.queryRunner);
        },
      });
    }
    // 最终注册为databasemodule的provider
    return {
      exports: providers,
      module: DatabaseModule,
      providers,
    };
  }
}
