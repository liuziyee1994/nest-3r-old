// app实例常量
import {
  BadGatewayException,
  Global,
  Module,
  ModuleMetadata,
  Type,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import chalk from 'chalk';
import { useContainer } from 'class-validator';

import { isNil, omit } from 'lodash';

import { ConfigModule } from '@/modules/config/config.module';
import { Configure } from '@/modules/config/configure';
import { CoreModule } from '@/modules/core/core.module';
import { CreateModule } from '@/modules/core/helpers/utils';
import { AppFilter } from '@/modules/core/providers/app.filter';
import { AppIntercepter } from '@/modules/core/providers/app.interceptor';
import { AppPipe } from '@/modules/core/providers/app.pipe';
import { App, AppConfig, CreateOptions } from '@/modules/core/types';

export const app: App = { configure: new Configure() };

/**
 * 创建一个应用
 * @param options 创建选项
 */
export const createApp = (options: CreateOptions) => async (): Promise<App> => {
  const { config, builder } = options;
  // 初始化配置实例,也就是每个模块都依赖的configure
  await app.configure.initilize(config.factories, config.storage);
  // 如果没有app配置则使用默认配置
  if (!app.configure.has('app')) {
    throw new BadGatewayException('App config not exists!');
  }
  // 创建启动模块
  // 这个就是原来的appmoudle
  const BootModule = await createBootModule(app.configure, options);
  // 创建app的容器实例
  app.container = await builder({
    configure: app.configure,
    BootModule,
  });
  // 设置api前缀
  if (app.configure.has('app.prefix')) {
    app.container.setGlobalPrefix(
      await app.configure.get<string>('app.prefix'),
    );
  }
  // 为class-validator添加容器以便在自定义约束中可以注入dataSource等依赖
  useContainer(app.container.select(BootModule), {
    fallbackOnErrors: true,
  });
  return app;
};

/**
 * 构建一个启动模块
 * @param params
 * @param options
 */
export async function createBootModule(
  configure: Configure,
  options: Pick<CreateOptions, 'globals' | 'providers' | 'modules'>,
): Promise<Type<any>> {
  const { globals = {}, providers = [] } = options;
  // 获取需要导入的模块
  const modules = await options.modules(configure);
  const imports: ModuleMetadata['imports'] =
    // Promise.all用来并行执行多个异步操作,返回一个包含所有操作结果的数组
    (
      await Promise.all([
        ...modules,
        // 下面返回的是动态模块,这两个模块是boot模块必须的
        ConfigModule.forRoot(configure),
        await CoreModule.forRoot(configure),
      ])
    ).map((item) => {
      // DynamicModule有一个module属性,有module属性代表这个模块是动态模块
      if ('module' in item) {
        // module和global是dynamicmodule的属性,排除掉这两个之后,得到的就是modulemetadata
        const meta = omit(item, ['module', 'global']);
        // 这里的效果等价于把@Module(metadata)放在模块顶部
        Module(meta)(item.module);
        // 相当于加上@Global
        if (item.global) Global()(item.module);
        // 这里的目的是将动态模块处理为静态模块,然后返回静态模块即可
        return item.module;
      }
      return item;
    });
  // 配置全局提供者
  if (globals.pipe !== null) {
    const pipe = globals.pipe
      ? globals.pipe(configure)
      : // 默认为apppipe
        new AppPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          validationError: { target: false },
        });
    providers.push({
      provide: APP_PIPE,
      useValue: pipe,
    });
  }
  if (globals.interceptor !== null) {
    providers.push({
      provide: APP_INTERCEPTOR,
      useClass: globals.interceptor ?? AppIntercepter,
    });
  }
  if (globals.filter !== null) {
    providers.push({
      provide: APP_FILTER,
      useClass: globals.filter ?? AppFilter,
    });
  }

  return CreateModule('BootModule', () => {
    const meta: ModuleMetadata = {
      imports,
      providers,
    };
    return meta;
  });
}

/**
 * 构建APP CLI,默认start命令应用启动监听app
 * @param creator APP构建器
 * @param listened 监听回调
 */
export async function startApp(
  creator: () => Promise<App>,
  listened?: (app: App, startTime: Date) => () => Promise<void>,
) {
  const startTime = new Date();
  const { container, configure } = await creator();
  app.container = container;
  app.configure = configure;
  const { port, host } = await configure.get<AppConfig>('app');
  await container.listen(port, host, listened(app, startTime));
}

/**
 * 输出API地址
 * @param factory
 */
export async function echoApi(
  configure: Configure,
  container: NestFastifyApplication,
) {
  const appUrl = await configure.get<string>('app.url');
  // 设置应用的API前缀,如果没有则与appUrl相同
  const urlPrefix = await configure.get('app.prefix', undefined);
  const apiUrl = !isNil(urlPrefix)
    ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
    : appUrl;
  console.log(`- RestAPI: ${chalk.green.underline(apiUrl)}`);
}

/**
 * 启动信息打印
 * @param app
 * @param startTime
 */
export const listened: (app: App, startTime: Date) => () => Promise<void> =
  ({ configure, container }, startTime) =>
  async () => {
    console.log();
    await echoApi(configure, container);
    console.log(
      'used time:',
      chalk.cyan(`${new Date().getTime() - startTime.getTime()}`),
    );
  };
