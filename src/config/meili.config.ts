import { MelliConfig } from '@/modules/meilisearch/types';

export const meili = (): MelliConfig => [
  {
    name: 'default',
    host: 'http://localhost:7700',
  },
];
