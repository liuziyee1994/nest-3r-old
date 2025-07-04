import { createMeiliConfig } from '@/modules/meilisearch/config';

export const meili = createMeiliConfig((configure) => [
  {
    name: 'default',
    host: 'http://localhost:7700',
  },
]);
