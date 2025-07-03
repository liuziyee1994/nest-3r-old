import { Config } from 'meilisearch';

import { OrderType } from '@/modules/database/constants';

// MelliSearch模块的配置
export type MelliConfig = MelliOption[];

// MeilliSearch的连接节点配置
export type MelliOption = Config & { name: string };

/**
 * 排序类型,{字段名称: 排序方法}
 * 如果多个值则传入数组即可
 * 排序方法不设置,默认DESC
 */
export type OrderQueryType =
  | string
  | { name: string; order: `${OrderType}` }
  | Array<{ name: string; order: `${OrderType}` } | string>;
