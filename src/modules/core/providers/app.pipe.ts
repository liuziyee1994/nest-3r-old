// src/modules/core/providers/app.pipe.ts
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Paramtype,
  ValidationPipe,
} from '@nestjs/common';
import { DTO_VALIDATION_OPTIONS } from '@/modules/core/constants';
import { deepMerge } from '@/modules/core/helpers';
import { isObject, omit } from 'lodash';

// todo:一部分没有看懂,如果需要的话,结合文档再看一遍
// todo:文档里说,如果直接将validationPipe注册为全局管道的话,会导致无法自动区分Body还是Query，也就是在发送body数据的时候可能会去验证query,这块没看懂
/**
 * 全局管道,用于处理DTO验证,也就是用来校验@Qeury和@Body后面的DTO
 */
@Injectable()
export class AppPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    // todo:value应该是请求数据,metadata应该是类型相关的数据
    // 这里的type是请求类型
    const { metatype, type } = metadata;
    // 获取要验证的dto
    const dto = metatype as any;
    // 获取dto类的装饰器元数据中的自定义验证选项
    const options = Reflect.getMetadata(DTO_VALIDATION_OPTIONS, dto) || {};
    // 把当前已设置的选项解构到备份对象
    const originOptions = { ...this.validatorOptions };
    // 把当前已设置的class-transform选项解构到备份对象
    const originTransform = { ...this.transformOptions };
    // 把自定义的class-transform和type选项解构出来
    // type重命名为optionsType
    const { transformOptions, type: optionsType, ...customOptions } = options;
    // 根据DTO类上设置的type来设置当前的DTO请求类型,默认为'body'
    const requestType: Paramtype = optionsType ?? 'body';

    // 如果被验证的DTO设置的请求类型与被验证的数据的请求类型不是同一种类型则跳过此管道
    if (requestType !== type) return value;

    // 合并当前transform选项和自定义选项
    if (transformOptions) {
      this.transformOptions = deepMerge(
        this.transformOptions,
        transformOptions ?? {},
        'replace',
      );
    }
    // 合并当前验证选项和自定义选项,比方说向自定义装饰器传入的groups参数
    this.validatorOptions = deepMerge(
      this.validatorOptions,
      customOptions ?? {},
      'replace',
    );
    const toValidate = isObject(value)
      ? Object.fromEntries(
          // object.entries()用来将对象转换为[k,v]的数组,即数组元素为[k,v]
          Object.entries(value as Record<string, any>).map(([key, v]) => {
            if (!isObject(v) || !('mimetype' in v)) return [key, v];
            return [key, omit(v, ['fields'])];
          }),
        )
      : value;
    try {
      // 序列化并验证dto对象
      let result = await super.transform(toValidate, metadata);
      // 这个transform方法是开发者定义的
      // 如果dto类的中存在transform静态方法,则返回调用进一步transform之后的结果
      if (typeof result.transform === 'function') {
        result = await result.transform(result);
        // 这里...是用来将除了transform之外的其他属性收集到data中
        const { transform, ...data } = result;
        result = data;
      }
      // 重置验证选项
      this.validatorOptions = originOptions;
      // 重置transform选项
      this.transformOptions = originTransform;
      return result;
    } catch (error: any) {
      // 重置验证选项
      this.validatorOptions = originOptions;
      // 重置transform选项
      this.transformOptions = originTransform;
      if ('response' in error) throw new BadRequestException(error.response);
      throw new BadRequestException(error);
    }
  }
}
