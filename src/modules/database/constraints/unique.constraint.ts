import { DataSource, ObjectType } from 'typeorm';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { isNil, merge } from 'lodash';

type Condition = {
  entity: ObjectType<any>;
  /**
   * 如果没有指定字段则使用当前验证的属性作为查询依据
   */
  property?: string;
};

/**
 * 验证某个字段的唯一性
 */
@ValidatorConstraint({ name: 'dataUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments) {
    // 获取要验证的模型和字段
    // 默认将当前验证的属性作为要去检查唯一性的字段
    const config: Omit<Condition, 'entity'> = {
      property: args.property,
    };
    const condition = ('entity' in args.constraints[0]
      ? merge(config, args.constraints[0])
      : {
          ...config,
          entity: args.constraints[0],
          // 先简单记住,这样类型断言是为了绕过类型检查
          // 与Partial相反,required的作用是将属性全部变为必需属性
        }) as unknown as Required<Condition>;
    if (!condition.entity) return false;
    try {
      // 查询是否存在数据,如果已经存在则验证失败
      const repo = this.dataSource.getRepository(condition.entity);
      return isNil(
        await repo.findOne({
          where: { [condition.property]: value },
          withDeleted: true,
        }),
      );
    } catch (err) {
      // 如果数据库操作异常则验证失败
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const { entity, property } = args.constraints[0];
    const queryProperty = property ?? args.property;
    if (!(args.object as any).getManager) {
      return 'getManager function not been found!';
    }
    if (!entity) {
      return 'Model not been specified!';
    }
    return `${queryProperty} of ${entity.name} must been unique!`;
  }
}

/**
 * 数据唯一性验证
 * @param params Entity类或验证条件对象
 * @param validationOptions
 */
export function IsUnique(
  params: ObjectType<any> | Condition,
  validationOptions?: ValidationOptions,
) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [params],
      validator: UniqueConstraint,
    });
  };
}
