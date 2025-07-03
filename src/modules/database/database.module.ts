import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import {
  getDataSourceToken,
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { CUSTOM_REPOSITORY_METADATA } from './constants';
import { DataSource, ObjectType } from 'typeorm';
import { DataExistConstraint } from '@/modules/database/constraints/data.exist.constraint';
import { UniqueConstraint } from '@/modules/database/constraints/unique.constraint';
import { UniqueExistConstraint } from '@/modules/database/constraints/unique.exist.constraint';
import { UniqueTreeConstraint } from '@/modules/database/constraints/tree.unique.constraint';
import { UniqueTreeExistConstraint } from '@/modules/database/constraints/tree.unique.exist.constraint';

@Module({})
export class DatabaseModule {
  // 这里传入的是配置函数(即函数返回的是options),而不是直接传入静态配置
  static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
    return {
      global: true,
      module: DatabaseModule,
      imports: [TypeOrmModule.forRoot(configRegister())],
      providers: [
        DataExistConstraint,
        UniqueConstraint,
        UniqueExistConstraint,
        UniqueTreeConstraint,
        UniqueTreeExistConstraint,
      ],
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
