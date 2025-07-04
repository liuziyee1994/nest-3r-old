import chalk from 'chalk';
import { isNil } from 'lodash';

import { PanicOption } from '@/modules/core/types';

/**
 * 输出命令行错误消息
 * @param option
 */
export async function panic(option: PanicOption | string) {
  console.log();
  if (typeof option === 'string') {
    console.log(chalk.red(`\n❌ ${option}`));
    process.exit(1);
  }
  const { error, message, exit = true } = option;
  !isNil(error)
    ? console.log(chalk.red(error))
    : console.log(chalk.red(`\n❌ ${message}`));
  if (exit) process.exit(1);
}
