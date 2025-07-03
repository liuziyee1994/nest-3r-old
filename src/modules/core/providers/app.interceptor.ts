import {
  ClassSerializerInterceptor,
  PlainLiteralObject,
  StreamableFile,
} from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';
import { isArray, isNil, isObject } from 'lodash';

// 项目结构中,将拦截器和管道都放在了provider目录下
// 这个拦截器在接口返回数据前做序列化处理
export class AppIntercepter extends ClassSerializerInterceptor {
  serialize(
    response: PlainLiteralObject | Array<PlainLiteralObject>,
    options: ClassTransformOptions,
  ): PlainLiteralObject | PlainLiteralObject[] {
    if (
      (!isObject(response) && !isArray(response)) ||
      response instanceof StreamableFile
    ) {
      return response;
    }

    // 如果是响应数据是数组,则遍历对每一项进行序列化
    if (isArray(response)) {
      return (response as PlainLiteralObject[]).map((item) =>
        !isObject(item) ? item : this.transformToPlain(item, options),
      );
    }
    // 如果是分页数据,则对items中的每一项进行序列化
    if ('meta' in response && 'items' in response) {
      const items =
        !isNil(response.items) && isArray(response.items) ? response.items : [];
      return {
        ...response,
        items: (items as PlainLiteralObject[]).map((item) => {
          return !isObject(item) ? item : this.transformToPlain(item, options);
        }),
      };
    }
    // 如果响应是个对象则直接序列化
    return this.transformToPlain(response, options);
  }
}
