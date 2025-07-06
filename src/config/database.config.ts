import { toNumber } from 'lodash';

import { createDbConfig } from '@/modules/database/config';

export const database = createDbConfig((configure) => ({
  common: {
    synchronize: true,
  },
  connections: [
    {
      // 以下为mysql配置
      type: 'mysql',
      host: configure.env.get('DB_HOST', '127.0.0.1'),
      port: configure.env.get('DB_PORT', (v) => toNumber(v), 3306),
      username: configure.env.get('DB_USERNAME', 'root'),
      password: configure.env.get('DB_PASSWORD', '1234'),
      database: configure.env.get('DB_NAME', 'demo'),
    },
  ],
}));
