import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 判断两个字段的值是否相等的验证规则
 */
// 这里定义的是验证逻辑
@ValidatorConstraint({ name: 'isMatch' })
export class MatchConstraint implements ValidatorConstraintInterface {
  // value指的是当前验证的属性值,在下面的示例中value是plainPassword的值
  validate(value: any, args: ValidationArguments) {
    const [relatedProperty, reverse] = args.constraints;
    // args.object是请求数据的实例
    const relatedValue = (args.object as any)[relatedProperty];
    return reverse ? value !== relatedValue : value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedProperty, reverse] = args.constraints;
    return `${relatedProperty} and ${args.property} ${
      reverse ? `is` : `don't`
    } match`;
  }
}

/**
 * 判断DTO中两个属性的值是否相等的验证规则
 * @param relatedProperty 用于对比的属性名称
 * @param reverse 是否反转
 * @param validationOptions class-validator库的选项
 */
export function IsMatch(
  relatedProperty: string,
  reverse = false,
  validationOptions?: ValidationOptions,
) {
  // propertyName就是当前验证的属性名,在下面的示例中是plainPassword
  return (object: Record<string, any>, propertyName: string) => {
    // 注册装饰器
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [relatedProperty, reverse],
      // 执行验证逻辑的类
      validator: MatchConstraint,
    });
  };
}

/*@Length(8, 50, {
  message: '密码长度不得少于$constraint1',
})
readonly password: string;

// 这里放的是isMatch,因为它返回的是注册装饰器的函数
// value是plainPassword,relatedProperty是password
@IsMatch('password', { message: '两次输入密码不同' })
@IsNotEmpty({ message: '请再次输入密码以确认' })
readonly plainPassword: string;*/
