import { Transform } from 'class-transformer';

import { IsBoolean, IsOptional } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators/dto-validation.decorator';
import { toBoolean } from '@/modules/core/helpers';
import { DeleteDto } from '@/modules/restful/dtos/delete.dto';

/**
 * 带软删除的批量删除验证
 */
@DtoValidation()
export class DeleteWithTrashDto extends DeleteDto {
  /**
   * 是否软删除
   */
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  trash?: boolean;
}
