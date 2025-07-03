// src/modules/core/providers/app.filter.ts
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Type,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  EntityNotFoundError,
  EntityPropertyNotFoundError,
  QueryFailedError,
} from 'typeorm';
import { isObject } from 'lodash';

/**
 * 全局过滤器,用于响应自定义异常
 */
@Catch()
// todo: 这里为什么要用Type<Error>,直接用Error可不可以
export class AppFilter<T = Error> extends BaseExceptionFilter<T> {
  protected resExceptions: Array<
    { class: Type<Error>; status?: number } | Type<Error>
  > = [
    { class: EntityNotFoundError, status: HttpStatus.NOT_FOUND },
    { class: QueryFailedError, status: HttpStatus.BAD_REQUEST },
    { class: EntityPropertyNotFoundError, status: HttpStatus.BAD_REQUEST },
  ];

  // eslint-disable-next-line consistent-return
  catch(exception: T, host: ArgumentsHost) {
    // (...)!是非空断言,即告诉编译器这个不是null或者undefined
    const applicationRef =
      this.applicationRef ||
      (this.httpAdapterHost && this.httpAdapterHost.httpAdapter)!;
    // 是否在自定义的异常处理类列表中
    const resException = this.resExceptions.find((item) =>
      'class' in item
        ? exception instanceof item.class
        : exception instanceof item,
    );

    // 如果不在自定义异常处理类列表也没有继承自HttpException
    if (!resException && !(exception instanceof HttpException)) {
      return this.handleUnknownError(exception, host, applicationRef);
    }
    let res: string | object = '';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      res = exception.getResponse();
      status = exception.getStatus();
    } else if (resException) {
      // 如果在自定义异常处理类列表中
      // 因为exception的类型是泛型的类型参数T,所以不能直接转为error,而是要先转为unknown,再转为error
      const e = exception as unknown as Error;
      res = e.message;
      if ('class' in resException && resException.status) {
        status = resException.status;
      }
    }
    const message = isObject(res)
      ? res
      : {
          statusCode: status,
          message: res,
        };
    // reply用来发送http响应
    // 0是request,1是response
    applicationRef!.reply(host.getArgByIndex(1), message, status);
  }
}
