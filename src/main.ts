import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      cors: true,
      logger: ['error', 'warn'],
    },
  );

  // 把nestjs的ioc容器给到class-validator,这样的话,验证约束类就可以注入nestjs的提供者,比如datasource
  useContainer(app.select(AppModule), {
    fallbackOnErrors: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(3100, () => {
    console.log('api: http://localhost:3100');
  });
}
bootstrap();
