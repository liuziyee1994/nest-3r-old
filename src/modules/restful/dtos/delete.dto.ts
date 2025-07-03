import { IsDefined, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators/dto-validation.decorator';

/**
 * 批量删除验证
 */
// 这个dto和模型没关系,是一个通用的dto
@DtoValidation()
export class DeleteDto {
  /**
   * 待删除数据的ID列表
   */
  @IsUUID(undefined, {
    each: true,
    message: 'ID格式错误',
  })
  @IsDefined({
    each: true,
    message: 'ID必须指定',
  })
  ids: string[];
}
