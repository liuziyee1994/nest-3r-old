import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostService } from '@/modules/content/services/post.service';

import { ContentConfig } from '@/modules/content/types';

import { DatabaseModule } from '../database/database.module';

// 这样引入后,controllers是类似这样的对象:
// {
//   PostController: PostController, // value是class
//   CommentController: CommentController
// }
import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';
import { SanitizeService } from './services/sanitize.service';
import { PostSubscriber } from './subscribers';

@Module({})
export class ContentModule {
  static forRoot(configRegister?: () => ContentConfig): DynamicModule {
    const config: Required<ContentConfig> = {
      searchType: 'mysql',
      ...(configRegister ? configRegister() : {}),
    };
    // 组装providers
    // ModuleMetadata是接口,它是一个类型,不是一个对象(或实例),所以ModuleMetadata['providers']拿到的是providers的类型
    // 对于一个modulemetadata类型的对象,对象['providers']拿到的是值
    const providers: ModuleMetadata['providers'] = [
      ...Object.values(services),
      SanitizeService,
      PostSubscriber,
      // 因为postservice的构造器要传入searchType,所以这里要使用useFactory的方式来注册
      // searchType又来自于contentconfig,所以要将contentmodule改造为动态模块
      {
        provide: PostService,
        inject: [
          repositories.PostRepository,
          repositories.CategoryRepository,
          services.CategoryService,
          repositories.TagRepository,
          { token: services.SearchService, optional: true },
        ],
        useFactory(
          postRepository: repositories.PostRepository,
          categoryRepository: repositories.CategoryRepository,
          categoryService: services.CategoryService,
          tagRepository: repositories.TagRepository,
          searchService: services.SearchService,
        ) {
          return new PostService(
            postRepository,
            categoryRepository,
            categoryService,
            tagRepository,
            searchService,
            config.searchType,
          );
        },
      },
    ];
    if (config.searchType === 'meili') providers.push(services.SearchService);
    return {
      module: ContentModule,
      imports: [
        TypeOrmModule.forFeature(Object.values(entities)),
        DatabaseModule.forRepository(Object.values(repositories)),
      ],
      controllers: Object.values(controllers),
      providers,
      exports: [
        ...Object.values(services),
        PostService,
        DatabaseModule.forRepository(Object.values(repositories)),
      ],
    };
  }
}
